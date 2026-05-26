export interface AuthenticatedUser {
  user_id: number;
  entity_type: string;
  roles: string[];
}
