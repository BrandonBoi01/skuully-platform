import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../access-control/permissions.guard";
import { RequirePermissions } from "../access-control/permissions.decorator";
import { PERMISSIONS } from "../access-control/permissions.constants";
import { InstitutionsService } from "./institutions.service";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { CreateRoleDto } from "./dto/create-role.dto";
import { AssignRoleDto } from "./dto/assign-role.dto";
import { AssignDepartmentDto } from "./dto/assign-department.dto";
import { ListJoinRequestsDto } from "./dto/list-join-requests.dto";
import { ReviewJoinRequestDto } from "./dto/review-join-request.dto";
import { CreateMembershipInviteDto } from "./dto/create-membership-invite.dto";
import { AcceptMembershipInviteDto } from "./dto/accept-membership-invite.dto";

@Controller("institutions")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Get(":institutionId")
  @RequirePermissions(PERMISSIONS.INSTITUTION_VIEW)
  getInstitution(@Param("institutionId") institutionId: string) {
    return this.institutionsService.getInstitutionById(institutionId);
  }

  @Get(":institutionId/memberships")
  @RequirePermissions(PERMISSIONS.MEMBERSHIP_VIEW)
  listMemberships(@Param("institutionId") institutionId: string) {
    return this.institutionsService.listMemberships(institutionId);
  }

  @Get(":institutionId/join-requests")
  @RequirePermissions(PERMISSIONS.MEMBERSHIP_VIEW)
  listJoinRequests(
    @Param("institutionId") institutionId: string,
    @Query() query: ListJoinRequestsDto
  ) {
    return this.institutionsService.listJoinRequests(institutionId, query);
  }

  @Patch(":institutionId/join-requests/:joinRequestId/review")
  @RequirePermissions(PERMISSIONS.MEMBERSHIP_ASSIGN)
  reviewJoinRequest(
    @Param("institutionId") institutionId: string,
    @Param("joinRequestId") joinRequestId: string,
    @Body() dto: ReviewJoinRequestDto,
    @Req() req: any
  ) {
    return this.institutionsService.reviewJoinRequest(
      institutionId,
      joinRequestId,
      dto,
      req.user.userId
    );
  }

  @Post(":institutionId/invites")
  @RequirePermissions(PERMISSIONS.MEMBERSHIP_INVITE)
  createMembershipInvite(
    @Param("institutionId") institutionId: string,
    @Body() dto: CreateMembershipInviteDto,
    @Req() req: any
  ) {
    return this.institutionsService.createMembershipInvite(
      institutionId,
      dto,
      req.user.userId
    );
  }

  @Get(":institutionId/invites")
  @RequirePermissions(PERMISSIONS.MEMBERSHIP_VIEW)
  listMembershipInvites(@Param("institutionId") institutionId: string) {
    return this.institutionsService.listMembershipInvites(institutionId);
  }

  @Get(":institutionId/departments")
  @RequirePermissions(PERMISSIONS.DEPARTMENT_VIEW)
  listDepartments(@Param("institutionId") institutionId: string) {
    return this.institutionsService.listDepartments(institutionId);
  }

  @Post(":institutionId/departments")
  @RequirePermissions(PERMISSIONS.DEPARTMENT_CREATE)
  createDepartment(
    @Param("institutionId") institutionId: string,
    @Body() dto: CreateDepartmentDto
  ) {
    return this.institutionsService.createDepartment(institutionId, dto);
  }

  @Post(":institutionId/departments/assign")
  @RequirePermissions(PERMISSIONS.DEPARTMENT_ASSIGN)
  assignDepartment(
    @Param("institutionId") institutionId: string,
    @Body() dto: AssignDepartmentDto
  ) {
    return this.institutionsService.assignDepartment(
      institutionId,
      dto.membershipId,
      dto.departmentId
    );
  }

  @Get(":institutionId/roles")
  @RequirePermissions(PERMISSIONS.ROLE_VIEW)
  listRoles(@Param("institutionId") institutionId: string) {
    return this.institutionsService.listRoles(institutionId);
  }

  @Post(":institutionId/roles")
  @RequirePermissions(PERMISSIONS.ROLE_CREATE)
  createRole(
    @Param("institutionId") institutionId: string,
    @Body() dto: CreateRoleDto
  ) {
    return this.institutionsService.createRole(institutionId, dto);
  }

  @Post(":institutionId/roles/assign")
  @RequirePermissions(PERMISSIONS.ROLE_ASSIGN)
  assignRole(
    @Param("institutionId") institutionId: string,
    @Body() dto: AssignRoleDto
  ) {
    return this.institutionsService.assignRole(
      institutionId,
      dto.membershipId,
      dto.roleId
    );
  }
}

@Controller("membership-invites")
@UseGuards(JwtAuthGuard)
export class MembershipInvitesController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Post("accept")
  acceptInvite(@Req() req: any, @Body() dto: AcceptMembershipInviteDto) {
    return this.institutionsService.acceptMembershipInvite(
      req.user.userId,
      dto.code
    );
  }
}