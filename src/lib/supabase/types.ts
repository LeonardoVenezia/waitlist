export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      accounts: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "accounts_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      account_members: {
        Row: {
          id: string;
          account_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
        };
        Insert: {
          id?: string;
          account_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
        };
        Update: {
          id?: string;
          account_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member";
        };
        Relationships: [
          {
            foreignKeyName: "account_members_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "account_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          account_id: string;
          name: string;
          slug: string;
          public_key: string;
          plan: "free" | "launch" | "grow";
          submission_limit: number;
          settings: Json;
          status: "active" | "archived";
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          name: string;
          slug: string;
          public_key?: string;
          plan?: "free" | "launch" | "grow";
          submission_limit?: number;
          settings?: Json;
          status?: "active" | "archived";
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          name?: string;
          slug?: string;
          public_key?: string;
          plan?: "free" | "launch" | "grow";
          submission_limit?: number;
          settings?: Json;
          status?: "active" | "archived";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "waitlists_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      subscribers: {
        Row: {
          id: string;
          waitlist_id: string;
          email: string;
          referral_code: string;
          referred_by: string | null;
          referral_count: number;
          verified: boolean;
          status: "active" | "hidden" | "blocked" | "pending_unlock";
          metadata: Json;
          created_at: string;
          email_status: string | null;
          name: string | null;
          country: string | null;
        };
        Insert: {
          id?: string;
          waitlist_id: string;
          email: string;
          referral_code: string;
          referred_by?: string | null;
          referral_count?: number;
          verified?: boolean;
          status?: "active" | "hidden" | "blocked" | "pending_unlock";
          metadata?: Json;
          created_at?: string;
          email_status?: string | null;
          name?: string | null;
          country?: string | null;
        };
        Update: {
          id?: string;
          waitlist_id?: string;
          email?: string;
          referral_code?: string;
          referred_by?: string | null;
          referral_count?: number;
          verified?: boolean;
          status?: "active" | "hidden" | "blocked" | "pending_unlock";
          metadata?: Json;
          created_at?: string;
          email_status?: string | null;
          name?: string | null;
          country?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscribers_waitlist_id_fkey";
            columns: ["waitlist_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscribers_referred_by_fkey";
            columns: ["referred_by"];
            referencedRelation: "subscribers";
            referencedColumns: ["id"];
          },
        ];
      };
      purchases: {
        Row: {
          id: string;
          account_id: string;
          waitlist_id: string;
          paddle_transaction_id: string;
          plan: string;
          amount: number;
          currency: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          waitlist_id: string;
          paddle_transaction_id: string;
          plan: string;
          amount: number;
          currency: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          waitlist_id?: string;
          paddle_transaction_id?: string;
          plan?: string;
          amount?: number;
          currency?: string;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchases_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "purchases_waitlist_id_fkey";
            columns: ["waitlist_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      showcases: {
        Row: {
          id: string;
          waitlist_id: string;
          name: string;
          slug: string;
          link: string;
          description: string;
          category_1: string;
          category_2: string | null;
          images: Json;
          video_url: string | null;
          featured_badge: boolean;
          main_type: "image" | "video";
          main_image: string | null;
          card_image: string | null;
          status: "draft" | "published" | "rejected" | "coming_soon" | "expired";
          claimable: boolean;
          domain_check_passed: boolean;
          spam_check_passed: boolean;
          last_domain_check: string | null;
          last_spam_check: string | null;
          published_at: string | null;
          expires_at: string | null;
          expired_at: string | null;
          notified_30d_at: string | null;
          notified_7d_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          waitlist_id: string;
          name: string;
          slug: string;
          link: string;
          description: string;
          category_1: string;
          category_2?: string | null;
          images?: Json;
          video_url?: string | null;
          featured_badge?: boolean;
          main_type?: "image" | "video";
          main_image?: string | null;
          card_image?: string | null;
          status?: "draft" | "published" | "rejected" | "coming_soon";
          claimable?: boolean;
          domain_check_passed?: boolean;
          spam_check_passed?: boolean;
          last_domain_check?: string | null;
          last_spam_check?: string | null;
          published_at?: string | null;
          expires_at?: string | null;
          expired_at?: string | null;
          notified_30d_at?: string | null;
          notified_7d_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          waitlist_id?: string;
          name?: string;
          slug?: string;
          link?: string;
          description?: string;
          category_1?: string;
          category_2?: string | null;
          images?: Json;
          video_url?: string | null;
          featured_badge?: boolean;
          main_type?: "image" | "video";
          main_image?: string | null;
          card_image?: string | null;
          status?: "draft" | "published" | "rejected" | "coming_soon" | "expired";
          claimable?: boolean;
          domain_check_passed?: boolean;
          spam_check_passed?: boolean;
          last_domain_check?: string | null;
          last_spam_check?: string | null;
          published_at?: string | null;
          expires_at?: string | null;
          expired_at?: string | null;
          notified_30d_at?: string | null;
          notified_7d_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "showcases_waitlist_id_fkey";
            columns: ["waitlist_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      page_events: {
        Row: {
          id: string;
          waitlist_id: string;
          type: "view" | "signup";
          created_at: string;
        };
        Insert: {
          id?: string;
          waitlist_id: string;
          type: "view" | "signup";
          created_at?: string;
        };
        Update: {
          id?: string;
          waitlist_id?: string;
          type?: "view" | "signup";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "page_events_waitlist_id_fkey";
            columns: ["waitlist_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      testimonial_forms: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          slug: string;
          description: string | null;
          questions: Json;
          fields: Json;
          redirect_url: string | null;
          design: Json;
          moderation: "manual" | "auto";
          status: "draft" | "published" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          slug: string;
          description?: string | null;
          questions?: Json;
          fields?: Json;
          redirect_url?: string | null;
          design?: Json;
          moderation?: "manual" | "auto";
          status?: "draft" | "published" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          questions?: Json;
          fields?: Json;
          redirect_url?: string | null;
          design?: Json;
          moderation?: "manual" | "auto";
          status?: "draft" | "published" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "testimonial_forms_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      testimonials: {
        Row: {
          id: string;
          project_id: string;
          form_id: string | null;
          name: string;
          email: string | null;
          company: string | null;
          role: string | null;
          message: string;
          rating: number;
          avatar_url: string | null;
          media_url: string | null;
          media_type: "none" | "image" | "video";
          source: "form" | "manual" | "import";
          tags: string[] | null;
          is_featured: boolean;
          answers: Json;
          status: "pending" | "approved" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          form_id?: string | null;
          name: string;
          email?: string | null;
          company?: string | null;
          role?: string | null;
          message: string;
          rating?: number;
          avatar_url?: string | null;
          media_url?: string | null;
          media_type?: "none" | "image" | "video";
          source?: "form" | "manual" | "import";
          tags?: string[] | null;
          is_featured?: boolean;
          answers?: Json;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          form_id?: string | null;
          name?: string;
          email?: string | null;
          company?: string | null;
          role?: string | null;
          message?: string;
          rating?: number;
          avatar_url?: string | null;
          media_url?: string | null;
          media_type?: "none" | "image" | "video";
          source?: "form" | "manual" | "import";
          tags?: string[] | null;
          is_featured?: boolean;
          answers?: Json;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "testimonials_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "testimonials_form_id_fkey";
            columns: ["form_id"];
            referencedRelation: "testimonial_forms";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          account_id: string;
          project_id: string;
          paddle_subscription_id: string;
          plan: "launch" | "grow";
          status: "active" | "canceled" | "past_due" | "paused";
          current_period_end: string;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          project_id: string;
          paddle_subscription_id: string;
          plan?: "launch" | "grow";
          status?: "active" | "canceled" | "past_due" | "paused";
          current_period_end: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          project_id?: string;
          paddle_subscription_id?: string;
          plan?: "launch";
          status?: "active" | "canceled" | "past_due" | "paused";
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_claims: {
        Row: {
          id: string;
          showcase_id: string;
          claimant_user_id: string;
          status: "pending" | "approved" | "rejected";
          message: string | null;
          rejected_reason: string | null;
          created_at: string;
          resolved_at: string | null;
          resolved_by: string | null;
        };
        Insert: {
          id?: string;
          showcase_id: string;
          claimant_user_id: string;
          status?: "pending" | "approved" | "rejected";
          message?: string | null;
          rejected_reason?: string | null;
          created_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Update: {
          id?: string;
          showcase_id?: string;
          claimant_user_id?: string;
          status?: "pending" | "approved" | "rejected";
          message?: string | null;
          rejected_reason?: string | null;
          created_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "project_claims_showcase_id_fkey";
            columns: ["showcase_id"];
            referencedRelation: "showcases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_claims_claimant_user_id_fkey";
            columns: ["claimant_user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      email_queue: {
        Row: {
          id: string;
          to_email: string;
          subject: string;
          template: string;
          payload: Json;
          status: "pending" | "sent" | "failed";
          attempts: number;
          last_error: string | null;
          created_at: string;
          sent_at: string | null;
        };
        Insert: {
          id?: string;
          to_email: string;
          subject: string;
          template: string;
          payload?: Json;
          status?: "pending" | "sent" | "failed";
          attempts?: number;
          last_error?: string | null;
          created_at?: string;
          sent_at?: string | null;
        };
        Update: {
          id?: string;
          to_email?: string;
          subject?: string;
          template?: string;
          payload?: Json;
          status?: "pending" | "sent" | "failed";
          attempts?: number;
          last_error?: string | null;
          created_at?: string;
          sent_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_position: {
        Args: { p_subscriber_id: string };
        Returns: number;
      };
      increment_referral_count: {
        Args: { p_subscriber_id: string };
        Returns: undefined;
      };
      expire_due_showcases: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
  };
}
