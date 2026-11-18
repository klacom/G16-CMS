export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      audit_entries: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_role: string | null;
          area: string;
          changes: Json;
          created_at: string;
          id: number;
          target_id: string | null;
          target_label: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_role?: string | null;
          area: string;
          changes?: Json;
          created_at?: string;
          id?: never;
          target_id?: string | null;
          target_label?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_role?: string | null;
          area?: string;
          changes?: Json;
          created_at?: string;
          id?: never;
          target_id?: string | null;
          target_label?: string | null;
        };
        Relationships: [];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          affiliation: string | null;
          created_at: string;
          delivery_error: boolean;
          email: string;
          expires_at: string;
          full_name: string | null;
          id: string;
          invited_by: string;
          role: string;
          state: string;
        };
        Insert: {
          accepted_at?: string | null;
          affiliation?: string | null;
          created_at?: string;
          delivery_error?: boolean;
          email: string;
          expires_at?: string;
          full_name?: string | null;
          id?: string;
          invited_by: string;
          role: string;
          state?: string;
        };
        Update: {
          accepted_at?: string | null;
          affiliation?: string | null;
          created_at?: string;
          delivery_error?: boolean;
          email?: string;
          expires_at?: string;
          full_name?: string | null;
          id?: string;
          invited_by?: string;
          role?: string;
          state?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_preferences: {
        Row: {
          email_preferences: Json;
          user_id: string;
        };
        Insert: {
          email_preferences?: Json;
          user_id: string;
        };
        Update: {
          email_preferences?: Json;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          article_id: string | null;
          created_at: string;
          dedupe_key: string;
          id: string;
          kind: string;
          payload: Json;
          read_at: string | null;
          recipient_id: string;
          review_id: string | null;
        };
        Insert: {
          article_id?: string | null;
          created_at?: string;
          dedupe_key: string;
          id?: string;
          kind: string;
          payload?: Json;
          read_at?: string | null;
          recipient_id: string;
          review_id?: string | null;
        };
        Update: {
          article_id?: string | null;
          created_at?: string;
          dedupe_key?: string;
          id?: string;
          kind?: string;
          payload?: Json;
          read_at?: string | null;
          recipient_id?: string;
          review_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          affiliation: string | null;
          avatar_path: string | null;
          created_at: string;
          deactivated_at: string | null;
          full_name: string;
          id: string;
          invited_by: string | null;
          role: string;
          sessions_valid_after: string;
        };
        Insert: {
          affiliation?: string | null;
          avatar_path?: string | null;
          created_at?: string;
          deactivated_at?: string | null;
          full_name: string;
          id: string;
          invited_by?: string | null;
          role: string;
          sessions_valid_after?: string;
        };
        Update: {
          affiliation?: string | null;
          avatar_path?: string | null;
          created_at?: string;
          deactivated_at?: string | null;
          full_name?: string;
          id?: string;
          invited_by?: string | null;
          role?: string;
          sessions_valid_after?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      about_sections: {
        Row: {
          body: Json | null;
          body_text: string | null;
          heading: string | null;
          key: string | null;
          position: number | null;
        };
        Insert: {
          body?: Json | null;
          body_text?: string | null;
          heading?: string | null;
          key?: string | null;
          position?: number | null;
        };
        Update: {
          body?: Json | null;
          body_text?: string | null;
          heading?: string | null;
          key?: string | null;
          position?: number | null;
        };
        Relationships: [];
      };
      article_revisions: {
        Row: {
          article_id: string | null;
          body: Json | null;
          body_text: string | null;
          byline_affiliation: string | null;
          byline_name: string | null;
          category_id: string | null;
          created_at: string | null;
          display_until: string | null;
          editor_ids: string[] | null;
          event_ends_at: string | null;
          event_starts_at: string | null;
          excerpt: string | null;
          id: string | null;
          images: Json | null;
          map_url: string | null;
          parent_revision_id: string | null;
          sealed_at: string | null;
          search_document: unknown;
          tags: string[] | null;
          title: string | null;
          type: string | null;
          venue: string | null;
          version: number | null;
        };
        Insert: {
          article_id?: string | null;
          body?: Json | null;
          body_text?: string | null;
          byline_affiliation?: string | null;
          byline_name?: string | null;
          category_id?: string | null;
          created_at?: string | null;
          display_until?: string | null;
          editor_ids?: string[] | null;
          event_ends_at?: string | null;
          event_starts_at?: string | null;
          excerpt?: string | null;
          id?: string | null;
          images?: Json | null;
          map_url?: string | null;
          parent_revision_id?: string | null;
          sealed_at?: string | null;
          search_document?: unknown;
          tags?: string[] | null;
          title?: string | null;
          type?: string | null;
          venue?: string | null;
          version?: number | null;
        };
        Update: {
          article_id?: string | null;
          body?: Json | null;
          body_text?: string | null;
          byline_affiliation?: string | null;
          byline_name?: string | null;
          category_id?: string | null;
          created_at?: string | null;
          display_until?: string | null;
          editor_ids?: string[] | null;
          event_ends_at?: string | null;
          event_starts_at?: string | null;
          excerpt?: string | null;
          id?: string | null;
          images?: Json | null;
          map_url?: string | null;
          parent_revision_id?: string | null;
          sealed_at?: string | null;
          search_document?: unknown;
          tags?: string[] | null;
          title?: string | null;
          type?: string | null;
          venue?: string | null;
          version?: number | null;
        };
        Relationships: [];
      };
      articles: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          first_published_at: string | null;
          id: string | null;
          owner_id: string | null;
          public_updated_at: string | null;
          published_at: string | null;
          published_revision_id: string | null;
          scheduled_at: string | null;
          slug: string | null;
          status: string | null;
          updated_at: string | null;
          visibility: string | null;
          working_revision_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          first_published_at?: string | null;
          id?: string | null;
          owner_id?: string | null;
          public_updated_at?: string | null;
          published_at?: string | null;
          published_revision_id?: string | null;
          scheduled_at?: string | null;
          slug?: string | null;
          status?: string | null;
          updated_at?: string | null;
          visibility?: string | null;
          working_revision_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          first_published_at?: string | null;
          id?: string | null;
          owner_id?: string | null;
          public_updated_at?: string | null;
          published_at?: string | null;
          published_revision_id?: string | null;
          scheduled_at?: string | null;
          slug?: string | null;
          status?: string | null;
          updated_at?: string | null;
          visibility?: string | null;
          working_revision_id?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          archived_at: string | null;
          id: string | null;
          name: string | null;
          slug: string | null;
        };
        Insert: {
          archived_at?: string | null;
          id?: string | null;
          name?: string | null;
          slug?: string | null;
        };
        Update: {
          archived_at?: string | null;
          id?: string | null;
          name?: string | null;
          slug?: string | null;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          article_id: string | null;
          body: string | null;
          closed_at: string | null;
          closed_by: string | null;
          created_at: string | null;
          email: string | null;
          event_place: string | null;
          event_starts_at: string | null;
          event_title: string | null;
          first_name: string | null;
          id: string | null;
          last_name: string | null;
          last_reply_id: string | null;
          phone: string | null;
          read_at: string | null;
          status: string | null;
          subject: string | null;
          topic: string | null;
          version: number | null;
        };
        Insert: {
          article_id?: string | null;
          body?: string | null;
          closed_at?: string | null;
          closed_by?: string | null;
          created_at?: string | null;
          email?: string | null;
          event_place?: string | null;
          event_starts_at?: string | null;
          event_title?: string | null;
          first_name?: string | null;
          id?: string | null;
          last_name?: string | null;
          last_reply_id?: string | null;
          phone?: string | null;
          read_at?: string | null;
          status?: string | null;
          subject?: string | null;
          topic?: string | null;
          version?: number | null;
        };
        Update: {
          article_id?: string | null;
          body?: string | null;
          closed_at?: string | null;
          closed_by?: string | null;
          created_at?: string | null;
          email?: string | null;
          event_place?: string | null;
          event_starts_at?: string | null;
          event_title?: string | null;
          first_name?: string | null;
          id?: string | null;
          last_name?: string | null;
          last_reply_id?: string | null;
          phone?: string | null;
          read_at?: string | null;
          status?: string | null;
          subject?: string | null;
          topic?: string | null;
          version?: number | null;
        };
        Relationships: [];
      };
      contact_replies: {
        Row: {
          body: string | null;
          created_at: string | null;
          delivery_id: string | null;
          delivery_status: string | null;
          id: string | null;
          message_id: string | null;
          request_key: string | null;
          sent_at: string | null;
          sent_by: string | null;
        };
        Insert: {
          body?: string | null;
          created_at?: string | null;
          delivery_id?: string | null;
          delivery_status?: string | null;
          id?: string | null;
          message_id?: string | null;
          request_key?: string | null;
          sent_at?: string | null;
          sent_by?: string | null;
        };
        Update: {
          body?: string | null;
          created_at?: string | null;
          delivery_id?: string | null;
          delivery_status?: string | null;
          id?: string | null;
          message_id?: string | null;
          request_key?: string | null;
          sent_at?: string | null;
          sent_by?: string | null;
        };
        Relationships: [];
      };
      desk_article_list: {
        Row: {
          excerpt: string | null;
          id: string | null;
          owner_id: string | null;
          published_at: string | null;
          published_revision_id: string | null;
          scheduled_at: string | null;
          slug: string | null;
          status: string | null;
          title: string | null;
          type: string | null;
          updated_at: string | null;
          visibility: string | null;
          working_revision_id: string | null;
        };
        Relationships: [];
      };
      featured_stories: {
        Row: {
          article_id: string | null;
          position: number | null;
        };
        Insert: {
          article_id?: string | null;
          position?: number | null;
        };
        Update: {
          article_id?: string | null;
          position?: number | null;
        };
        Relationships: [];
      };
      job_failures: {
        Row: {
          code: string | null;
          created_at: string | null;
          id: number | null;
          job: string | null;
          target_id: string | null;
        };
        Insert: {
          code?: string | null;
          created_at?: string | null;
          id?: number | null;
          job?: string | null;
          target_id?: string | null;
        };
        Update: {
          code?: string | null;
          created_at?: string | null;
          id?: number | null;
          job?: string | null;
          target_id?: string | null;
        };
        Relationships: [];
      };
      media_assets: {
        Row: {
          article_id: string | null;
          bytes: number | null;
          content_type: string | null;
          created_at: string | null;
          id: string | null;
          owner_id: string | null;
          purpose: string | null;
          state: string | null;
        };
        Insert: {
          article_id?: string | null;
          bytes?: number | null;
          content_type?: string | null;
          created_at?: string | null;
          id?: string | null;
          owner_id?: string | null;
          purpose?: string | null;
          state?: string | null;
        };
        Update: {
          article_id?: string | null;
          bytes?: number | null;
          content_type?: string | null;
          created_at?: string | null;
          id?: string | null;
          owner_id?: string | null;
          purpose?: string | null;
          state?: string | null;
        };
        Relationships: [];
      };
      public_articles: {
        Row: {
          body: Json | null;
          byline_affiliation: string | null;
          byline_name: string | null;
          category_id: string | null;
          category_name: string | null;
          category_slug: string | null;
          display_until: string | null;
          event_ends_at: string | null;
          event_starts_at: string | null;
          excerpt: string | null;
          first_published_at: string | null;
          id: string | null;
          images: Json | null;
          map_url: string | null;
          published_at: string | null;
          search_document: unknown;
          slug: string | null;
          tags: string[] | null;
          title: string | null;
          type: string | null;
          updated_at: string | null;
          venue: string | null;
          visibility: string | null;
        };
        Relationships: [];
      };
      review_assignments: {
        Row: {
          article_id: string | null;
          created_at: string | null;
          decided_at: string | null;
          decision: string | null;
          decision_note: string | null;
          id: string | null;
          needed_by: string | null;
          note: string | null;
          requested_by: string | null;
          responded_at: string | null;
          reviewer_id: string | null;
          revision_id: string | null;
          round: number | null;
          state: string | null;
        };
        Insert: {
          article_id?: string | null;
          created_at?: string | null;
          decided_at?: string | null;
          decision?: string | null;
          decision_note?: string | null;
          id?: string | null;
          needed_by?: string | null;
          note?: string | null;
          requested_by?: string | null;
          responded_at?: string | null;
          reviewer_id?: string | null;
          revision_id?: string | null;
          round?: number | null;
          state?: string | null;
        };
        Update: {
          article_id?: string | null;
          created_at?: string | null;
          decided_at?: string | null;
          decision?: string | null;
          decision_note?: string | null;
          id?: string | null;
          needed_by?: string | null;
          note?: string | null;
          requested_by?: string | null;
          responded_at?: string | null;
          reviewer_id?: string | null;
          revision_id?: string | null;
          round?: number | null;
          state?: string | null;
        };
        Relationships: [];
      };
      review_comments: {
        Row: {
          article_id: string | null;
          author_id: string | null;
          body: string | null;
          created_at: string | null;
          id: string | null;
        };
        Insert: {
          article_id?: string | null;
          author_id?: string | null;
          body?: string | null;
          created_at?: string | null;
          id?: string | null;
        };
        Update: {
          article_id?: string | null;
          author_id?: string | null;
          body?: string | null;
          created_at?: string | null;
          id?: string | null;
        };
        Relationships: [];
      };
      review_requests: {
        Row: {
          assignment_id: string | null;
          fix_note: string | null;
          id: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          text: string | null;
        };
        Insert: {
          assignment_id?: string | null;
          fix_note?: string | null;
          id?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          text?: string | null;
        };
        Update: {
          assignment_id?: string | null;
          fix_note?: string | null;
          id?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          text?: string | null;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          public_details: Json | null;
          updated_at: string | null;
        };
        Insert: {
          public_details?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          public_details?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          archived_at: string | null;
          name: string | null;
        };
        Insert: {
          archived_at?: string | null;
          name?: string | null;
        };
        Update: {
          archived_at?: string | null;
          name?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      accept_invitation: {
        Args: { p_id: string; p_name: string };
        Returns: undefined;
      };
      add_comment: {
        Args: { p_article: string; p_body: string; p_key: string };
        Returns: undefined;
      };
      auth_event: {
        Args: { p_action: string; p_user: string };
        Returns: undefined;
      };
      authorize_email_change: {
        Args: { p_email: string; p_user: string };
        Returns: undefined;
      };
      bootstrap_admin: {
        Args: { p_id: string; p_name: string };
        Returns: undefined;
      };
      calendar_counts: {
        Args: { p_category?: string; p_from: string; p_to: string };
        Returns: {
          day: string;
          total: number;
        }[];
      };
      change_publication: {
        Args: { p_action: string; p_id: string; p_revision: string };
        Returns: undefined;
      };
      claim_deliveries: { Args: { p_limit?: number }; Returns: Json };
      complete_media: { Args: { p_id: string }; Returns: undefined };
      configure_worker: {
        Args: { p_origin: string; p_secret: string };
        Returns: undefined;
      };
      create_article: {
        Args: { p_title: string; p_type?: string };
        Returns: string;
      };
      create_invitation: {
        Args: {
          p_affiliation?: string;
          p_email: string;
          p_name?: string;
          p_role: string;
        };
        Returns: string;
      };
      current_profile: {
        Args: never;
        Returns: {
          affiliation: string | null;
          avatar_path: string | null;
          created_at: string;
          deactivated_at: string | null;
          full_name: string;
          id: string;
          invited_by: string | null;
          role: string;
          sessions_valid_after: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "profiles";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      desk_counts: { Args: never; Returns: Json };
      desk_month: { Args: { p_month: string }; Returns: Json };
      export_audit: {
        Args: {
          p_action?: string;
          p_area?: string;
          p_from: string;
          p_to: string;
        };
        Returns: Json;
      };
      finish_delivery: {
        Args: {
          p_error?: string;
          p_id: string;
          p_lease: string;
          p_provider?: string;
          p_retryable?: boolean;
        };
        Returns: undefined;
      };
      invitation_details: {
        Args: { p_id: string };
        Returns: {
          affiliation: string;
          email: string;
          expires_at: string;
          full_name: string;
          id: string;
          inviter_name: string;
          role: string;
        }[];
      };
      log_audit_export: {
        Args: { p_count: number; p_from: string; p_to: string };
        Returns: undefined;
      };
      manage_contact: {
        Args: { p_action: string; p_id: string; p_version: number };
        Returns: undefined;
      };
      manage_person: {
        Args: { p_id: string; p_patch: Json };
        Returns: undefined;
      };
      media_location: {
        Args: { p_id: string };
        Returns: {
          bytes: number;
          content_type: string;
          object_path: string;
        }[];
      };
      operations_status: { Args: never; Returns: Json };
      people_directory: {
        Args: { p_filter?: string; p_offset?: number; p_query?: string };
        Returns: {
          affiliation: string;
          created_at: string;
          deactivated_at: string;
          email: string;
          full_name: string;
          id: string;
          role: string;
          total: number;
        }[];
      };
      public_anniversaries: {
        Args: { p_day: string };
        Returns: {
          body: Json | null;
          byline_affiliation: string | null;
          byline_name: string | null;
          category_id: string | null;
          category_name: string | null;
          category_slug: string | null;
          display_until: string | null;
          event_ends_at: string | null;
          event_starts_at: string | null;
          excerpt: string | null;
          first_published_at: string | null;
          id: string | null;
          images: Json | null;
          map_url: string | null;
          published_at: string | null;
          search_document: unknown;
          slug: string | null;
          tags: string[] | null;
          title: string | null;
          type: string | null;
          updated_at: string | null;
          venue: string | null;
          visibility: string | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "public_articles";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      publish_article: {
        Args: { p_id: string; p_revision: string; p_schedule?: string };
        Returns: undefined;
      };
      queue_test_email: { Args: never; Returns: undefined };
      read_notification: { Args: { p_id?: string }; Returns: undefined };
      reconcile_mail_worker: { Args: never; Returns: boolean };
      record_delivery_event: {
        Args: {
          p_id: string;
          p_kind: string;
          p_provider: string;
          p_time: string;
        };
        Returns: undefined;
      };
      remove_avatar: { Args: never; Returns: undefined };
      reply_contact: {
        Args: {
          p_body: string;
          p_id: string;
          p_key: string;
          p_version: number;
        };
        Returns: string;
      };
      reserve_media: {
        Args: {
          p_article?: string;
          p_bytes: number;
          p_purpose: string;
          p_type: string;
        };
        Returns: {
          id: string;
          object_path: string;
        }[];
      };
      resolve_request: {
        Args: { p_id: string; p_note?: string; p_resolved: boolean };
        Returns: undefined;
      };
      review_action: {
        Args: {
          p_action: string;
          p_id: string;
          p_note?: string;
          p_requests?: string[];
        };
        Returns: undefined;
      };
      review_counts: { Args: never; Returns: Json };
      review_page: {
        Args: { p_history?: boolean; p_id?: string; p_page?: number };
        Returns: {
          article_id: string;
          created_at: string;
          decision: string;
          excerpt: string;
          id: string;
          needed_by: string;
          note: string;
          revision_id: string;
          round: number;
          state: string;
          title: string;
          type: string;
          writer_name: string;
        }[];
      };
      review_queue: {
        Args: never;
        Returns: {
          article_id: string;
          created_at: string;
          decision: string;
          excerpt: string;
          id: string;
          needed_by: string;
          note: string;
          revision_id: string;
          round: number;
          state: string;
          title: string;
          type: string;
          writer_name: string;
        }[];
      };
      reviewer_directory: {
        Args: never;
        Returns: {
          affiliation: string;
          full_name: string;
          id: string;
        }[];
      };
      run_editorial_jobs: { Args: never; Returns: number };
      run_housekeeping: { Args: never; Returns: undefined };
      save_about: {
        Args: {
          p_body: Json;
          p_heading: string;
          p_key: string;
          p_position?: number;
        };
        Returns: undefined;
      };
      save_article: {
        Args: {
          p_id: string;
          p_patch: Json;
          p_revision: string;
          p_version: number;
        };
        Returns: Json;
      };
      save_category: {
        Args: { p_action?: string; p_id?: string; p_name: string };
        Returns: undefined;
      };
      save_preferences: { Args: { p_preferences: Json }; Returns: undefined };
      save_profile: {
        Args: { p_avatar?: string; p_name: string };
        Returns: undefined;
      };
      save_site_settings: { Args: { p_details: Json }; Returns: undefined };
      save_tag: {
        Args: { p_action?: string; p_name: string };
        Returns: undefined;
      };
      set_featured: {
        Args: { p_article?: string; p_position: number };
        Returns: undefined;
      };
      submit_article: {
        Args: {
          p_deadline?: string;
          p_id: string;
          p_note?: string;
          p_reviewer: string;
          p_revision: string;
          p_version: number;
        };
        Returns: string;
      };
      submit_contact: {
        Args: { p_data: Json; p_honeypot?: string; p_key: string };
        Returns: string;
      };
      withdraw_invitation: { Args: { p_id: string }; Returns: undefined };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
