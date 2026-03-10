// src/dashboard/dashboard.gateway.ts
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";

type JoinRoomsPayload = {
  schoolId?: string;
  programId?: string;
  classId?: string;
  studentId?: string;
  staffId?: string;
};

type DashboardSocketUser = {
  userId: string;
  schoolId?: string | null;
  programId?: string | null;
  role?: string | null;
  membershipId?: string | null;
};

type RefreshPayload = {
  scope: string;
  schoolId: string;
  reason: string;
  at: string;
  programId?: string;
  classId?: string;
  studentId?: string;
  staffId?: string;
};

@Injectable()
@WebSocketGateway({
  namespace: "/dashboard",
  cors: {
    origin: "*",
  },
})
export class DashboardGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const user = await this.authenticateClient(client);
      client.data.user = user;

      if (user.schoolId) {
        client.join(this.schoolRoom(user.schoolId));
        client.join(this.controlCenterRoom(user.schoolId));
      }

      if (user.programId) {
        client.join(this.programRoom(user.programId));
      }

      client.emit("dashboard:connected", {
        ok: true,
        socketId: client.id,
        namespace: "/dashboard",
        user: {
          userId: user.userId,
          schoolId: user.schoolId ?? null,
          programId: user.programId ?? null,
          role: user.role ?? null,
        },
      });
    } catch {
      client.emit("dashboard:error", {
        ok: false,
        message: "Unauthorized websocket connection",
      });
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: Socket) {
    // no-op for now
  }

  @SubscribeMessage("dashboard:join")
  handleJoin(
    @MessageBody() payload: JoinRoomsPayload,
    @ConnectedSocket() client: Socket
  ) {
    const user = client.data.user as DashboardSocketUser | undefined;

    if (!user?.userId) {
      throw new UnauthorizedException("Unauthorized websocket client");
    }

    if (payload.schoolId) {
      if (user.schoolId !== payload.schoolId) {
        throw new UnauthorizedException("You cannot join another school room");
      }
      client.join(this.schoolRoom(payload.schoolId));
      client.join(this.controlCenterRoom(payload.schoolId));
    }

    if (payload.programId) {
      if (user.programId !== payload.programId) {
        throw new UnauthorizedException("You cannot join another program room");
      }
      client.join(this.programRoom(payload.programId));
    }

    if (payload.classId) {
      client.join(this.classRoom(payload.classId));
    }

    if (payload.studentId) {
      client.join(this.studentRoom(payload.studentId));
    }

    if (payload.staffId) {
      client.join(this.staffRoom(payload.staffId));
    }

    client.emit("dashboard:joined", {
      ok: true,
      schoolId: payload.schoolId ?? user.schoolId ?? null,
      programId: payload.programId ?? user.programId ?? null,
      classId: payload.classId ?? null,
      studentId: payload.studentId ?? null,
      staffId: payload.staffId ?? null,
    });
  }

  emitSchoolRefresh(schoolId: string, reason: string) {
    const payload = this.makePayload({
      scope: "school",
      schoolId,
      reason,
    });

    this.server.to(this.schoolRoom(schoolId)).emit("dashboard:refresh", payload);
    this.server
      .to(this.controlCenterRoom(schoolId))
      .emit("dashboard:control-center:refresh", payload);
  }

  emitProgramRefresh(schoolId: string, programId: string, reason: string) {
    const schoolPayload = this.makePayload({
      scope: "school",
      schoolId,
      reason,
    });

    const programPayload = this.makePayload({
      scope: "program",
      schoolId,
      programId,
      reason,
    });

    const controlCenterPayload = this.makePayload({
      scope: "control_center",
      schoolId,
      programId,
      reason,
    });

    this.server.to(this.schoolRoom(schoolId)).emit("dashboard:refresh", schoolPayload);
    this.server.to(this.programRoom(programId)).emit("dashboard:refresh", programPayload);
    this.server
      .to(this.controlCenterRoom(schoolId))
      .emit("dashboard:control-center:refresh", controlCenterPayload);
  }

  emitClassRefresh(
    schoolId: string,
    programId: string,
    classId: string,
    reason: string
  ) {
    const schoolPayload = this.makePayload({
      scope: "school",
      schoolId,
      reason,
    });

    const programPayload = this.makePayload({
      scope: "program",
      schoolId,
      programId,
      reason,
    });

    const classPayload = this.makePayload({
      scope: "class",
      schoolId,
      programId,
      classId,
      reason,
    });

    const controlCenterPayload = this.makePayload({
      scope: "control_center",
      schoolId,
      programId,
      classId,
      reason,
    });

    this.server.to(this.schoolRoom(schoolId)).emit("dashboard:refresh", schoolPayload);
    this.server.to(this.programRoom(programId)).emit("dashboard:refresh", programPayload);
    this.server.to(this.classRoom(classId)).emit("dashboard:refresh", classPayload);
    this.server
      .to(this.controlCenterRoom(schoolId))
      .emit("dashboard:control-center:refresh", controlCenterPayload);
  }

  emitStudentRefresh(
    schoolId: string,
    programId: string,
    studentId: string,
    reason: string
  ) {
    const schoolPayload = this.makePayload({
      scope: "school",
      schoolId,
      reason,
    });

    const programPayload = this.makePayload({
      scope: "program",
      schoolId,
      programId,
      reason,
    });

    const studentPayload = this.makePayload({
      scope: "student",
      schoolId,
      programId,
      studentId,
      reason,
    });

    const controlCenterPayload = this.makePayload({
      scope: "control_center",
      schoolId,
      programId,
      studentId,
      reason,
    });

    this.server.to(this.schoolRoom(schoolId)).emit("dashboard:refresh", schoolPayload);
    this.server.to(this.programRoom(programId)).emit("dashboard:refresh", programPayload);
    this.server.to(this.studentRoom(studentId)).emit("dashboard:refresh", studentPayload);
    this.server
      .to(this.controlCenterRoom(schoolId))
      .emit("dashboard:control-center:refresh", controlCenterPayload);
  }

  emitStaffRefresh(
    schoolId: string,
    programId: string,
    staffId: string,
    reason: string
  ) {
    const schoolPayload = this.makePayload({
      scope: "school",
      schoolId,
      reason,
    });

    const programPayload = this.makePayload({
      scope: "program",
      schoolId,
      programId,
      reason,
    });

    const staffPayload = this.makePayload({
      scope: "staff",
      schoolId,
      programId,
      staffId,
      reason,
    });

    const controlCenterPayload = this.makePayload({
      scope: "control_center",
      schoolId,
      programId,
      staffId,
      reason,
    });

    this.server.to(this.schoolRoom(schoolId)).emit("dashboard:refresh", schoolPayload);
    this.server.to(this.programRoom(programId)).emit("dashboard:refresh", programPayload);
    this.server.to(this.staffRoom(staffId)).emit("dashboard:refresh", staffPayload);
    this.server
      .to(this.controlCenterRoom(schoolId))
      .emit("dashboard:control-center:refresh", controlCenterPayload);
  }

  emitControlCenterRefresh(
    schoolId: string,
    programId: string,
    reason: string
  ) {
    const schoolPayload = this.makePayload({
      scope: "school",
      schoolId,
      reason,
    });

    const programPayload = this.makePayload({
      scope: "program",
      schoolId,
      programId,
      reason,
    });

    const controlCenterPayload = this.makePayload({
      scope: "control_center",
      schoolId,
      programId,
      reason,
    });

    this.server.to(this.schoolRoom(schoolId)).emit("dashboard:refresh", schoolPayload);
    this.server.to(this.programRoom(programId)).emit("dashboard:refresh", programPayload);
    this.server
      .to(this.controlCenterRoom(schoolId))
      .emit("dashboard:control-center:refresh", controlCenterPayload);
  }

  private makePayload(args: {
    scope: string;
    schoolId: string;
    reason: string;
    programId?: string;
    classId?: string;
    studentId?: string;
    staffId?: string;
  }): RefreshPayload {
    return {
      scope: args.scope,
      schoolId: args.schoolId,
      reason: args.reason,
      at: new Date().toISOString(),
      ...(args.programId ? { programId: args.programId } : {}),
      ...(args.classId ? { classId: args.classId } : {}),
      ...(args.studentId ? { studentId: args.studentId } : {}),
      ...(args.staffId ? { staffId: args.staffId } : {}),
    };
  }

  private async authenticateClient(client: Socket): Promise<DashboardSocketUser> {
    const token = this.extractToken(client);

    if (!token) {
      throw new UnauthorizedException("Missing websocket token");
    }

    const payload = await this.jwt.verifyAsync(token, {
      secret: this.config.getOrThrow<string>("JWT_SECRET"),
    });

    return {
      userId: payload.sub,
      schoolId: payload.schoolId ?? null,
      programId: payload.programId ?? null,
      role: payload.role ?? null,
      membershipId: payload.membershipId ?? null,
    };
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === "string" && authToken.trim()) {
      return authToken.trim();
    }

    const header = client.handshake.headers?.authorization;
    if (typeof header === "string" && header.startsWith("Bearer ")) {
      return header.slice(7).trim();
    }

    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === "string" && queryToken.trim()) {
      return queryToken.trim();
    }

    return null;
  }

  private schoolRoom(schoolId: string) {
    return `school:${schoolId}`;
  }

  private controlCenterRoom(schoolId: string) {
    return `control-center:${schoolId}`;
  }

  private programRoom(programId: string) {
    return `program:${programId}`;
  }

  private classRoom(classId: string) {
    return `class:${classId}`;
  }

  private studentRoom(studentId: string) {
    return `student:${studentId}`;
  }

  private staffRoom(staffId: string) {
    return `staff:${staffId}`;
  }
}