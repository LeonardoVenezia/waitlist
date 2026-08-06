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
      waitlists: {
        Row: {
          id: string;
          account_id: string;
          name: string;
          slug: string;
          public_key: string;
          plan: "free" | "launch" | "grow" | "scale";
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
          plan?: "free" | "launch" | "grow" | "scale";
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
          plan?: "free" | "launch" | "grow" | "scale";
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
          status: "active" | "hidden" | "blocked";
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
          status?: "active" | "hidden" | "blocked";
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
          status?: "active" | "hidden" | "blocked";
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
            referencedRelation: "waitlists";
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
            referencedRelation: "waitlists";
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
          status: "draft" | "published" | "rejected";
          domain_check_passed: boolean;
          spam_check_passed: boolean;
          last_domain_check: string | null;
          last_spam_check: string | null;
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
          status?: "draft" | "published" | "rejected";
          domain_check_passed?: boolean;
          spam_check_passed?: boolean;
          last_domain_check?: string | null;
          last_spam_check?: string | null;
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
          status?: "draft" | "published" | "rejected";
          domain_check_passed?: boolean;
          spam_check_passed?: boolean;
          last_domain_check?: string | null;
          last_spam_check?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "showcases_waitlist_id_fkey";
            columns: ["waitlist_id"];
            referencedRelation: "waitlists";
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
            referencedRelation: "waitlists";
            referencedColumns: ["id"];
          },
        ];
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
    };
    Enums: Record<string, never>;
  };
}
