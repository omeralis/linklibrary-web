/**
 * Compile-time contract check: every curated domain type must remain assignable to the schema
 * generated from the backend OpenAPI document. A drift (renamed field, changed enum) breaks
 * `npm run typecheck`. This module has no runtime code.
 */
import type { components } from './schema';
import type * as T from './types';

type S = components['schemas'];
type Assert<A extends B, B> = A;

export type ContractChecks = [
  Assert<T.User, S['User']>,
  Assert<T.AuthResult, S['AuthResult']>,
  Assert<T.PublicUser, S['PublicUser']>,
  Assert<T.PublicUserSummary, S['PublicUserSummary']>,
  Assert<T.UserSession, S['Session']>,
  Assert<T.ApiToken, S['ApiToken']>,
  Assert<T.Processing, S['Processing']>,
  Assert<T.PublicLink, S['PublicSavedLink']>,
  Assert<T.OwnedLink, S['SavedLink']>,
  Assert<T.ViewerLink, S['SavedLink']>,
  Assert<T.Collection, S['Collection']>,
  Assert<T.Category, S['Category']>,
  Assert<T.Tag, S['Tag']>,
  Assert<T.Invitation, S['Invitation']>,
  Assert<T.ReceivedInvitation, S['ReceivedInvitation']>,
  Assert<T.Grant, S['Grant']>,
  Assert<T.SecurityScan, S['SecurityScan']>,
  Assert<T.SecurityDetails, S['SecurityDetails']>,
  Assert<T.Appeal, S['Appeal']>,
  Assert<T.AppNotification, S['Notification']>,
  Assert<T.AuditLog, S['AuditLog']>,
  Assert<T.ApiErrorBody, S['Error']>,
  Assert<T.SecurityStatus, S['SecurityStatus']>,
  Assert<T.ProcessingStatus, S['ProcessingStatus']>,
  Assert<T.SourceType, S['SourceType']>,
  Assert<T.Visibility, S['Visibility']>,
];
