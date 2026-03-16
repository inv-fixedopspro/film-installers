import { SupabaseClient } from "@supabase/supabase-js";
import { callRpc, type RpcResult } from "./utils";
import type {
  InviteTeamMemberResult,
  AcceptTeamInvitationResult,
  LeaveTeamResult,
  RemoveTeamMemberResult,
  RevokeTeamInvitationResult,
  CompanyLocationResult,
  DeactivateLocationResult,
  CompanyLocationData,
} from "./types";

export async function inviteTeamMember(
  supabase: SupabaseClient,
  ownerId: string,
  employerProfileId: string,
  email: string
): Promise<RpcResult<InviteTeamMemberResult>> {
  return callRpc<InviteTeamMemberResult>(supabase, "invite_team_member", {
    p_owner_id:            ownerId,
    p_employer_profile_id: employerProfileId,
    p_email:               email,
  });
}

export async function acceptTeamInvitation(
  supabase: SupabaseClient,
  token: string,
  userId: string
): Promise<RpcResult<AcceptTeamInvitationResult>> {
  return callRpc<AcceptTeamInvitationResult>(supabase, "accept_team_invitation", {
    p_token:   token,
    p_user_id: userId,
  });
}

export async function leaveTeam(
  supabase: SupabaseClient,
  userId: string,
  employerProfileId: string
): Promise<RpcResult<LeaveTeamResult>> {
  return callRpc<LeaveTeamResult>(supabase, "leave_team", {
    p_user_id:            userId,
    p_employer_profile_id: employerProfileId,
  });
}

export async function removeTeamMember(
  supabase: SupabaseClient,
  ownerId: string,
  employerProfileId: string,
  targetUserId: string
): Promise<RpcResult<RemoveTeamMemberResult>> {
  return callRpc<RemoveTeamMemberResult>(supabase, "remove_team_member", {
    p_owner_id:            ownerId,
    p_employer_profile_id: employerProfileId,
    p_target_user_id:      targetUserId,
  });
}

export async function revokeTeamInvitation(
  supabase: SupabaseClient,
  ownerId: string,
  invitationId: string
): Promise<RpcResult<RevokeTeamInvitationResult>> {
  return callRpc<RevokeTeamInvitationResult>(supabase, "revoke_team_invitation", {
    p_owner_id:      ownerId,
    p_invitation_id: invitationId,
  });
}

export async function addCompanyLocation(
  supabase: SupabaseClient,
  ownerId: string,
  employerProfileId: string,
  locationData: CompanyLocationData
): Promise<RpcResult<CompanyLocationResult>> {
  return callRpc<CompanyLocationResult>(supabase, "add_company_location", {
    p_owner_id:            ownerId,
    p_employer_profile_id: employerProfileId,
    p_location_data:       locationData,
  });
}

export async function updateCompanyLocation(
  supabase: SupabaseClient,
  ownerId: string,
  locationId: string,
  locationData: Partial<CompanyLocationData>
): Promise<RpcResult<CompanyLocationResult>> {
  return callRpc<CompanyLocationResult>(supabase, "update_company_location", {
    p_owner_id:      ownerId,
    p_location_id:   locationId,
    p_location_data: locationData,
  });
}

export async function deactivateCompanyLocation(
  supabase: SupabaseClient,
  ownerId: string,
  locationId: string
): Promise<RpcResult<DeactivateLocationResult>> {
  return callRpc<DeactivateLocationResult>(supabase, "deactivate_company_location", {
    p_owner_id:    ownerId,
    p_location_id: locationId,
  });
}

export async function getCompanyLocations(
  supabase: SupabaseClient,
  callerId: string,
  employerProfileId: string
): Promise<RpcResult<CompanyLocationResult[]>> {
  return callRpc<CompanyLocationResult[]>(supabase, "get_company_locations", {
    p_caller_id:           callerId,
    p_employer_profile_id: employerProfileId,
  });
}
