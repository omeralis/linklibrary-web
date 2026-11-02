/* eslint-disable */
// AUTO-GENERATED from openapi/openapi.yaml by scripts/generate-api-types.mjs. Do not edit.

export type paths = {
  '/auth/register': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Register a new account */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            name: string;
            username: string;
            /** Format: email */
            email: string;
            password: string;
            password_confirmation: string;
            /** @enum {unknown} */
            locale?: 'ar' | 'en';
            /** @description Token mode only (non-SPA clients) */
            device_name?: string;
          };
        };
      };
      responses: {
        /** @description Created */
        201: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['AuthResult'];
            };
          };
        };
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/auth/login': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Sign in (session cookie for the SPA, bearer token otherwise) */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            /** Format: email */
            email: string;
            password: string;
            remember?: boolean;
            device_name?: string;
          };
        };
      };
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['AuthResult'];
            };
          };
        };
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/auth/logout': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Sign out (revokes the current token or session) */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/auth/me': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Current authenticated user */
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['User'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/auth/forgot-password': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Request a password reset link (identical response for unknown addresses) */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            /** Format: email */
            email: string;
          };
        };
      };
      responses: {
        /** @description OK */
        202: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/auth/reset-password': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Reset the password with an e-mailed token */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            token: string;
            /** Format: email */
            email: string;
            password: string;
            password_confirmation: string;
          };
        };
      };
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/auth/email/verification-notification': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Resend the verification e-mail */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        202: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/auth/email/verify/{id}/{hash}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Verify an e-mail address (signed link parameters from the e-mail) */
    get: {
      parameters: {
        query?: {
          /** @description Must be sent before signature, exactly as received */
          expires?: number;
          signature?: string;
        };
        header?: never;
        path: {
          /** @description User public id */
          id: string;
          /** @description SHA-1 of the e-mail address */
          hash: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/me': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get my account */
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['User'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    /** Delete my account permanently */
    delete: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            password: string;
            /** @constant */
            confirmation: 'DELETE';
          };
        };
      };
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    options?: never;
    head?: never;
    /** Update profile & preferences (changing e-mail requires current_password) */
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            name?: string;
            username?: string;
            /** Format: email */
            email?: string;
            current_password?: string;
            bio?: string;
            /** @enum {unknown} */
            locale?: 'ar' | 'en';
            /** @enum {unknown} */
            theme?: 'system' | 'light' | 'dark';
            profile_public?: boolean;
          };
        };
      };
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['User'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    trace?: never;
  };
  '/me/password': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /** Change password (signs out other sessions) */
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            current_password: string;
            password: string;
            password_confirmation: string;
          };
        };
      };
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    trace?: never;
  };
  '/me/avatar': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Upload avatar (JPEG/PNG/WebP/GIF, re-encoded server-side) */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'multipart/form-data': {
            /** Format: binary */
            image: string;
          };
        };
      };
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['User'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    /** Remove avatar */
    delete: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['User'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/me/sessions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List browser sessions (database session driver) */
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Session'][];
              meta?: {
                supported?: boolean;
              };
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/me/sessions/{sessionId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /** Revoke a session by fingerprint */
    delete: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description SHA-256 session fingerprint */
          sessionId: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/me/sessions/revoke-others': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Sign out all other sessions and tokens */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            current_password: string;
          };
        };
      };
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/me/tokens': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List API tokens */
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['ApiToken'][];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/me/tokens/{tokenId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /** Revoke an API token */
    delete: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          tokenId: number;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/me/invitations': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Pending invitations addressed to my verified e-mail (empty with meta.email_verified=false when unverified) */
    get: {
      parameters: {
        query?: {
          page?: number;
          per_page?: number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['ReceivedInvitation'][];
              meta?: components['schemas']['PaginationMeta'] & {
                email_verified?: boolean;
              };
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/me/invitations/{invitationId}/accept': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Accept an invitation in-app */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Invitation id */
          invitationId: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['SavedLink'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/links': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List my saved links */
    get: {
      parameters: {
        query?: {
          /** @description Full-text query (Arabic/English) */
          q?: string;
          /** @description Category slug (parent includes children) */
          category?: string;
          tag?: string;
          'tags[]'?: string[];
          source_type?: components['schemas']['SourceType'];
          page?: number;
          per_page?: number;
          favorite?: boolean;
          visibility?: components['schemas']['Visibility'];
          security_status?: components['schemas']['SecurityStatus'];
          collection?: string;
          trashed?: 'only' | 'with';
          sort?: 'latest' | 'oldest' | 'title' | 'popular' | 'relevance';
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['SavedLink'][];
              meta?: components['schemas']['PaginationMeta'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    /** Save a link (always PRIVATE; processing is asynchronous) */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            url: string;
            custom_title?: string;
            custom_description?: string;
            custom_source_type?: components['schemas']['SourceType'];
            notes?: string;
            category?: string;
            tags?: string[];
            collections?: string[];
          };
        };
      };
      responses: {
        /** @description Already saved (idempotent) */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['SavedLink'];
              meta?: {
                already_saved?: boolean;
              };
            };
          };
        };
        /** @description Created */
        201: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['SavedLink'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/links/{publicId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** View a saved link (owner, invited viewer, or public) */
    get: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['SavedLink'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    /** Delete (soft by default; ?permanent=1 for permanent). Revokes all grants and invitations. */
    delete: {
      parameters: {
        query?: {
          permanent?: boolean;
        };
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    options?: never;
    head?: never;
    /** Update manual metadata (owner) */
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            custom_title?: string | null;
            custom_description?: string;
            custom_image_url?: string;
            custom_source_type?: components['schemas']['SourceType'];
            notes?: string;
            category?: string;
            tags?: string[];
          };
        };
      };
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['SavedLink'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    trace?: never;
  };
  '/links/{publicId}/restore': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Restore a deleted link (restored as PRIVATE, grants are not restored) */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['SavedLink'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/links/{publicId}/favorite': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Toggle or set favorite */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody?: {
        content: {
          'application/json': {
            favorite?: boolean;
          };
        };
      };
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/links/{publicId}/visibility': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /** Change visibility (PUBLIC requires verified e-mail and CLEAR security status) */
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            visibility: components['schemas']['Visibility'];
          };
        };
      };
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['SavedLink'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    trace?: never;
  };
  '/links/{publicId}/sharing-settings': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /** Enable/disable resharing by viewers */
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            allow_resharing: boolean;
          };
        };
      };
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    trace?: never;
  };
  '/links/{publicId}/tags': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Add tags */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            tags: string[];
          };
        };
      };
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['SavedLink'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/links/{publicId}/tags/{tagSlug}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /** Remove a tag */
    delete: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
          /** @description Tag slug */
          tagSlug: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['SavedLink'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/links/{publicId}/cover': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Upload a custom cover image */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody: {
        content: {
          'multipart/form-data': {
            /** Format: binary */
            image?: string;
          };
        };
      };
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['SavedLink'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    /** Remove the custom cover image */
    delete: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['SavedLink'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/links/{publicId}/reanalyze': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Re-run extraction and AI (manual overrides preserved) */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        202: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Processing'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/links/{publicId}/processing-status': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Processing status */
    get: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Processing'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/links/{publicId}/open': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Platform-mediated open: returns the destination when the security policy allows it */
    get: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: {
                url?: string;
                security_status?: components['schemas']['SecurityStatus'];
                warning?: boolean;
              };
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/links/{publicId}/security': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Security status, scan history and appeals (owner) */
    get: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['SecurityDetails'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/links/{publicId}/security/rescan': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Request a security rescan */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        202: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['SecurityScan'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/links/{publicId}/security/appeal': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Request a security review (SUSPICIOUS/MALICIOUS only) */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            reason: string;
          };
        };
      };
      responses: {
        /** @description Created */
        201: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Appeal'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        409: components['responses']['Conflict'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/links/{publicId}/invitations': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List invitations (owner: all; viewer: own) */
    get: {
      parameters: {
        query?: {
          page?: number;
          per_page?: number;
        };
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Invitation'][];
              meta?: components['schemas']['PaginationMeta'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    /** Invite by e-mail (requires verified e-mail and CLEAR link) */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            /** Format: email */
            email: string;
          };
        };
      };
      responses: {
        /** @description Created */
        201: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Invitation'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        409: components['responses']['Conflict'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/links/{publicId}/invitations/{invitationId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /** Revoke a pending invitation */
    delete: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
          /** @description Invitation id */
          invitationId: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/invitations/{token}/accept': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Accept an invitation (authenticated, verified e-mail must match) */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description 64-hex-character token from the e-mail */
          token: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['SavedLink'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        409: components['responses']['Conflict'];
        /** @description Invitation expired */
        410: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Error'];
          };
        };
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/links/{publicId}/access': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Access graph (owner: all grants; viewer: grants they issued) */
    get: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Grant'][];
              meta?: {
                allow_resharing?: boolean;
                viewer_count?: number;
              };
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/links/{publicId}/access/{grantId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /** Revoke a grant and all dependent grants (owner, grantor, or the grantee leaving) */
    delete: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
          /** @description Grant id */
          grantId: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/shared-with-me': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Links shared with me (viewer representation) */
    get: {
      parameters: {
        query?: {
          /** @description Full-text query (Arabic/English) */
          q?: string;
          /** @description Category slug (parent includes children) */
          category?: string;
          tag?: string;
          'tags[]'?: string[];
          source_type?: components['schemas']['SourceType'];
          sort?: 'latest' | 'oldest' | 'title' | 'popular' | 'relevance';
          page?: number;
          per_page?: number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['SavedLink'][];
              meta?: components['schemas']['PaginationMeta'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/collections': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List my collections */
    get: {
      parameters: {
        query?: {
          page?: number;
          per_page?: number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Collection'][];
              meta?: components['schemas']['PaginationMeta'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    /** Create a collection */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            name: string;
            description?: string;
            visibility?: components['schemas']['Visibility'];
            cover_image_url?: string;
            sort_order?: number;
          };
        };
      };
      responses: {
        /** @description Created */
        201: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Collection'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/collections/{publicId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** View my collection with items */
    get: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Collection id */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Collection'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    /** Delete a collection (links are kept) */
    delete: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Collection id */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    options?: never;
    head?: never;
    /** Update a collection */
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Collection id */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            name?: string;
            description?: string;
            visibility?: components['schemas']['Visibility'];
            cover_image_url?: string;
            sort_order?: number;
          };
        };
      };
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Collection'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    trace?: never;
  };
  '/collections/{publicId}/links': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Add my saved links */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Collection id */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            links: string[];
          };
        };
      };
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/collections/{publicId}/links/{savedLinkPublicId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /** Remove a link from the collection */
    delete: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Collection id */
          publicId: string;
          /** @description Saved link id */
          savedLinkPublicId: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/collections/{publicId}/reorder': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /** Reorder items */
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Collection id */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            links: string[];
          };
        };
      };
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    trace?: never;
  };
  '/categories': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Active categories */
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Category'][];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/tags': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** My tags with usage counts (prefix filter) */
    get: {
      parameters: {
        query?: {
          q?: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Tag'][];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/search': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Search my links (incl. notes), links shared with me (public fields), or both; or my collections (type=collections returns Collection items) */
    get: {
      parameters: {
        query?: {
          q?: string;
          scope?: 'own' | 'shared' | 'all';
          type?: 'links' | 'collections';
          /** @description Category slug (parent includes children) */
          category?: string;
          tag?: string;
          'tags[]'?: string[];
          source_type?: components['schemas']['SourceType'];
          favorite?: boolean;
          sort?: 'relevance' | 'latest' | 'popular';
          page?: number;
          per_page?: number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['SavedLink'][];
              meta?: components['schemas']['PaginationMeta'] & {
                /** @enum {unknown} */
                scope?: 'own' | 'shared' | 'all';
              };
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/notifications': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List notifications */
    get: {
      parameters: {
        query?: {
          unread?: boolean;
          page?: number;
          per_page?: number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Notification'][];
              meta?: components['schemas']['PaginationMeta'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/notifications/unread-count': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Unread count */
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: {
                unread?: number;
              };
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/notifications/{id}/read': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /** Mark as read */
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Notification id */
          id: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Notification'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    trace?: never;
  };
  '/notifications/read-all': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Mark all as read */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/public/links': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Discover public links (latest / popular) */
    get: {
      parameters: {
        query?: {
          /** @description Full-text query (Arabic/English) */
          q?: string;
          /** @description Category slug (parent includes children) */
          category?: string;
          tag?: string;
          'tags[]'?: string[];
          source_type?: components['schemas']['SourceType'];
          language?: 'ar' | 'en';
          sort?: 'latest' | 'popular' | 'relevance';
          page?: number;
          per_page?: number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['PublicSavedLink'][];
              meta?: components['schemas']['PaginationMeta'];
            };
          };
        };
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/public/links/{publicId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** View a public link */
    get: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Saved link public identifier */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['PublicSavedLink'];
            };
          };
        };
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/public/categories': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Categories with public link counts */
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Category'][];
            };
          };
        };
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/public/tags': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Tags used by public links */
    get: {
      parameters: {
        query?: {
          q?: string;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Tag'][];
            };
          };
        };
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/public/users/{username}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Public profile */
    get: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Username */
          username: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['PublicUser'];
            };
          };
        };
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/public/users/{username}/links': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** A user's public links */
    get: {
      parameters: {
        query?: {
          /** @description Full-text query (Arabic/English) */
          q?: string;
          /** @description Category slug (parent includes children) */
          category?: string;
          tag?: string;
          'tags[]'?: string[];
          source_type?: components['schemas']['SourceType'];
          language?: 'ar' | 'en';
          sort?: 'latest' | 'popular' | 'relevance';
          page?: number;
          per_page?: number;
        };
        header?: never;
        path: {
          /** @description Username */
          username: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['PublicSavedLink'][];
              meta?: components['schemas']['PaginationMeta'];
            };
          };
        };
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/public/users/{username}/collections': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** A user's public collections */
    get: {
      parameters: {
        query?: {
          page?: number;
          per_page?: number;
        };
        header?: never;
        path: {
          /** @description Username */
          username: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Collection'][];
              meta?: components['schemas']['PaginationMeta'];
            };
          };
        };
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/public/collections/{publicId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Public collection: data = its publicly eligible links, meta.collection = the collection */
    get: {
      parameters: {
        query?: {
          page?: number;
          per_page?: number;
        };
        header?: never;
        path: {
          /** @description Collection id */
          publicId: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['PublicSavedLink'][];
              meta?: components['schemas']['PaginationMeta'] & {
                collection?: components['schemas']['Collection'];
              };
            };
          };
        };
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/public/search': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Search public links (q required) */
    get: {
      parameters: {
        query?: {
          /** @description Full-text query (Arabic/English) */
          q?: string;
          /** @description Category slug (parent includes children) */
          category?: string;
          tag?: string;
          'tags[]'?: string[];
          source_type?: components['schemas']['SourceType'];
          language?: 'ar' | 'en';
          sort?: 'latest' | 'popular' | 'relevance';
          page?: number;
          per_page?: number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['PublicSavedLink'][];
              meta?: components['schemas']['PaginationMeta'];
            };
          };
        };
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/admin/security/appeals': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List security appeals */
    get: {
      parameters: {
        query?: {
          status?: 'PENDING' | 'APPROVED' | 'REJECTED';
          page?: number;
          per_page?: number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Appeal'][];
              meta?: components['schemas']['PaginationMeta'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/admin/security/appeals/{appealId}/resolve': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Resolve an appeal */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Appeal id */
          appealId: string;
        };
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            /** @enum {unknown} */
            decision: 'APPROVE' | 'REJECT';
            /** @enum {unknown} */
            verdict?: 'CLEAR' | 'SUSPICIOUS';
            notes?: string;
          };
        };
      };
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Appeal'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/admin/security/links/{linkId}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /** Set a manual security verdict on a canonical link */
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          linkId: number;
        };
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            /** @enum {unknown} */
            verdict: 'CLEAR' | 'SUSPICIOUS' | 'MALICIOUS';
            notes?: string;
          };
        };
      };
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    trace?: never;
  };
  '/admin/categories': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** All categories */
    get: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Category'][];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    /** Create a category */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            slug: string;
            name_ar: string;
            name_en: string;
            description_ar?: string;
            description_en?: string;
            parent?: string;
            sort_order?: number;
            is_active?: boolean;
          };
        };
      };
      responses: {
        /** @description Created */
        201: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Category'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/admin/categories/{slug}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /** Deactivate a category */
    delete: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Category slug */
          slug: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'];
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    options?: never;
    head?: never;
    /** Update a category */
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          /** @description Category slug */
          slug: string;
        };
        cookie?: never;
      };
      requestBody: {
        content: {
          'application/json': {
            slug?: string;
            name_ar?: string;
            name_en?: string;
            description_ar?: string;
            description_en?: string;
            parent?: string;
            sort_order?: number;
            is_active?: boolean;
          };
        };
      };
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['Category'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    trace?: never;
  };
  '/admin/audit-logs': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Audit log */
    get: {
      parameters: {
        query?: {
          action?: string;
          target_type?: string;
          target_id?: string;
          page?: number;
          per_page?: number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        /** @description OK */
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            'application/json': components['schemas']['Envelope'] & {
              data?: components['schemas']['AuditLog'][];
              meta?: components['schemas']['PaginationMeta'];
            };
          };
        };
        401: components['responses']['Unauthenticated'];
        403: components['responses']['Forbidden'];
        404: components['responses']['NotFound'];
        422: components['responses']['ValidationError'];
        429: components['responses']['RateLimited'];
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
};
export type webhooks = Record<string, never>;
export type components = {
  schemas: {
    Envelope: {
      /** @constant */
      success: true;
      message?: string | null;
      data?: unknown;
      meta?: Record<string, unknown>;
    };
    Error: {
      /** @constant */
      success: false;
      message: string;
      errors: {
        [key: string]: string[];
      };
      code: string;
    };
    PaginationMeta: {
      pagination?: {
        current_page?: number;
        per_page?: number;
        has_more?: boolean;
        total?: number;
        last_page?: number;
      };
    };
    /** @enum {unknown} */
    Visibility: 'PRIVATE' | 'PUBLIC';
    /** @enum {unknown} */
    SecurityStatus: 'PENDING' | 'CLEAR' | 'SUSPICIOUS' | 'MALICIOUS' | 'UNKNOWN';
    /** @enum {unknown} */
    ProcessingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'BLOCKED';
    /** @enum {unknown} */
    SourceType: 'WEBSITE' | 'ARTICLE' | 'VIDEO' | 'PLAYLIST' | 'PDF' | 'REPOSITORY' | 'IMAGE' | 'AUDIO' | 'DOCUMENT' | 'OTHER';
    User: {
      /** Format: uuid */
      public_id?: string;
      name?: string;
      username?: string;
      email?: string;
      email_verified?: boolean;
      /** Format: date-time */
      email_verified_at?: string | null;
      avatar_url?: string | null;
      bio?: string | null;
      /** @enum {unknown} */
      locale?: 'ar' | 'en';
      /** @enum {unknown} */
      theme?: 'system' | 'light' | 'dark';
      profile_public?: boolean;
      is_admin?: boolean;
      /** Format: date-time */
      created_at?: string | null;
    };
    AuthResult: {
      user?: components['schemas']['User'];
      /** @enum {unknown} */
      auth_mode?: 'session' | 'token';
      token?: string;
      /** @constant */
      token_type?: 'Bearer';
      /** Format: date-time */
      expires_at?: string | null;
    };
    PublicUserSummary: {
      username?: string;
      name?: string;
      avatar_url?: string | null;
      profile_url?: string;
    };
    PublicUser: {
      username?: string;
      name?: string;
      avatar_url?: string | null;
      bio?: string | null;
      profile_url?: string;
      /** Format: date */
      joined_at?: string;
      stats?: {
        public_links?: number;
        public_collections?: number;
      };
    };
    Session: {
      id?: string;
      ip_address?: string | null;
      user_agent?: string | null;
      /** Format: date-time */
      last_active_at?: string | null;
      current?: boolean;
    };
    ApiToken: {
      id?: number;
      name?: string;
      /** Format: date-time */
      last_used_at?: string | null;
      /** Format: date-time */
      expires_at?: string | null;
      /** Format: date-time */
      created_at?: string | null;
      current?: boolean;
    };
    Processing: {
      status?: components['schemas']['ProcessingStatus'];
      security?: components['schemas']['SecurityStatus'];
      extraction?: string;
      extraction_error_code?: string | null;
      ai?: string;
      ai_enabled?: boolean;
    };
    PublicSavedLink: {
      /** Format: uuid */
      public_id?: string;
      /** @example /l/0d9a… */
      internal_path?: string;
      frontend_url?: string;
      /** @enum {unknown} */
      access_role?: 'owner' | 'viewer' | 'public';
      title?: string;
      description?: string | null;
      image_url?: string | null;
      favicon_url?: string | null;
      site_name?: string | null;
      hostname?: string;
      source_type?: components['schemas']['SourceType'];
      language?: string | null;
      author?: string | null;
      /** Format: date-time */
      source_published_at?: string | null;
      category?: {
        slug?: string;
        name?: string;
        name_ar?: string;
        name_en?: string;
      } | null;
      tags?: {
        name?: string;
        slug?: string;
        /** @enum {unknown} */
        source?: 'USER' | 'AI' | null;
      }[];
      /** @description AI-generated suggestions (clearly labelled) */
      ai?: {
        summary?: string | null;
        detailed_summary?: string | null;
        suggested_title?: string | null;
        suggested_category?: {
          slug?: string;
          name?: string;
          name_ar?: string;
          name_en?: string;
        } | null;
        suggested_tags?: string[];
        /** @constant */
        generated?: true;
      } | null;
      /** @description Original URL; null when the policy forbids exposing it to this caller */
      url?: string | null;
      /** @description Destination the client may open; null when blocked */
      open_url?: string | null;
      security?: {
        status?: components['schemas']['SecurityStatus'];
        can_open?: boolean;
        warning?: string | null;
        /** Format: date-time */
        checked_at?: string | null;
      };
      owner?: components['schemas']['PublicUserSummary'] | null;
      /** Format: date-time */
      published_at?: string | null;
    };
    /** @description Owner representation adds visibility, notes, overrides, extracted metadata, processing and permissions. Viewers additionally get shared_by and permissions. */
    SavedLink: components['schemas']['PublicSavedLink'] & {
      visibility?: components['schemas']['Visibility'];
      allow_resharing?: boolean;
      is_favorite?: boolean;
      notes?: string | null;
      overrides?: Record<string, unknown>;
      extracted?: Record<string, unknown>;
      processing_status?: components['schemas']['ProcessingStatus'];
      processing?: components['schemas']['Processing'];
      shared_by?: string | null;
      permissions?: {
        can_edit?: boolean;
        can_delete?: boolean;
        can_change_visibility?: boolean;
        can_publish?: boolean;
        can_share?: boolean;
        can_reshare?: boolean;
      };
      /** Format: date-time */
      created_at?: string | null;
      /** Format: date-time */
      updated_at?: string | null;
      /** Format: date-time */
      deleted_at?: string | null;
    };
    Collection: {
      /** Format: uuid */
      public_id?: string;
      frontend_url?: string;
      name?: string;
      description?: string | null;
      cover_image_url?: string | null;
      items_count?: number | null;
      owner?: components['schemas']['PublicUserSummary'] | null;
      visibility?: components['schemas']['Visibility'];
      sort_order?: number;
      items?: components['schemas']['SavedLink'][];
      /** Format: date-time */
      created_at?: string | null;
      /** Format: date-time */
      updated_at?: string | null;
    };
    Category: {
      slug?: string;
      name?: string;
      name_ar?: string;
      name_en?: string;
      description?: string | null;
      description_ar?: string | null;
      description_en?: string | null;
      parent_slug?: string | null;
      sort_order?: number;
      /** @description admins only */
      is_active?: boolean;
      /** @description public endpoints only */
      links_count?: number;
    };
    Tag: {
      name?: string;
      slug?: string;
      links_count?: number;
    };
    Invitation: {
      /** Format: uuid */
      id?: string;
      email?: string;
      /** @enum {unknown} */
      status?: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
      invited_by?: Record<string, unknown>;
      via_reshare?: boolean;
      /** Format: date-time */
      expires_at?: string | null;
      /** Format: date-time */
      accepted_at?: string | null;
      /** Format: date-time */
      revoked_at?: string | null;
      /** Format: date-time */
      created_at?: string | null;
    };
    ReceivedInvitation: {
      /** Format: uuid */
      id?: string;
      invited_by?: Record<string, unknown>;
      /** Format: date-time */
      expires_at?: string | null;
      /** Format: date-time */
      created_at?: string | null;
    };
    Grant: {
      /** Format: uuid */
      id?: string;
      grantee?: Record<string, unknown>;
      grantor?: Record<string, unknown>;
      parent_grant_id?: string | null;
      depth?: number;
      /** @enum {unknown} */
      status?: 'ACTIVE' | 'REVOKED';
      effective?: boolean;
      revoke_reason?: string | null;
      /** Format: date-time */
      created_at?: string | null;
      /** Format: date-time */
      revoked_at?: string | null;
    };
    SecurityScan: {
      trigger?: string;
      status?: string;
      verdict?: components['schemas']['SecurityStatus'] | null;
      providers?: Record<string, unknown>[];
      error_code?: string | null;
      /** Format: date-time */
      created_at?: string | null;
      /** Format: date-time */
      completed_at?: string | null;
    };
    SecurityDetails: {
      status?: components['schemas']['SecurityStatus'];
      stored_status?: components['schemas']['SecurityStatus'];
      /** @enum {unknown} */
      source?: 'PROVIDER' | 'MANUAL_REVIEW';
      /** Format: date-time */
      checked_at?: string | null;
      /** Format: date-time */
      expires_at?: string | null;
      can_publish?: boolean;
      can_share?: boolean;
      can_open?: boolean;
      disclaimer?: string;
      history?: components['schemas']['SecurityScan'][];
      appeals?: components['schemas']['Appeal'][];
    };
    Appeal: {
      /** Format: uuid */
      id?: string;
      /** @enum {unknown} */
      status?: 'PENDING' | 'APPROVED' | 'REJECTED';
      security_status_at_submission?: components['schemas']['SecurityStatus'];
      reason?: string;
      resolution_verdict?: string | null;
      reviewer_notes?: string | null;
      /** Format: date-time */
      resolved_at?: string | null;
      /** Format: date-time */
      created_at?: string | null;
    };
    Notification: {
      /** Format: uuid */
      id?: string;
      /**
       * @example sharing.invitation_received
       * @example sharing.invitation_accepted
       * @example sharing.access_revoked
       * @example security.warning
       * @example processing.failed
       * @example account.password_changed
       */
      kind?: string;
      data?: Record<string, unknown>;
      read?: boolean;
      /** Format: date-time */
      read_at?: string | null;
      /** Format: date-time */
      created_at?: string | null;
    };
    AuditLog: {
      id?: number;
      action?: string;
      actor?: string | null;
      target_type?: string | null;
      target_id?: string | null;
      metadata?: Record<string, unknown> | null;
      /** Format: date-time */
      created_at?: string | null;
    };
  };
  responses: {
    /** @description Authentication required (code UNAUTHENTICATED) */
    Unauthenticated: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['Error'];
      };
    };
    /** @description Forbidden (FORBIDDEN, EMAIL_NOT_VERIFIED, ACCOUNT_SUSPENDED, LINK_SECURITY_BLOCKED…) */
    Forbidden: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['Error'];
      };
    };
    /** @description Not found or not accessible (NOT_FOUND) */
    NotFound: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['Error'];
      };
    };
    /** @description Validation or domain rule failed (VALIDATION_ERROR, INVALID_URL, URL_NOT_ALLOWED, LINK_NOT_PUBLISHABLE, LINK_NOT_SHAREABLE…) */
    ValidationError: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['Error'];
      };
    };
    /** @description Conflict (ALREADY_SHARED, GRANT_CYCLE, ALREADY_OWNER, INVITATION_NOT_PENDING…) */
    Conflict: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['Error'];
      };
    };
    /** @description Too many requests (RATE_LIMITED); see Retry-After */
    RateLimited: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['Error'];
      };
    };
  };
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
};
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
