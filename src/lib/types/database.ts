export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "trainer" | "member";
export type MembershipStatus = "active" | "expired" | "frozen" | "cancelled";
export type PaymentStatus = "paid" | "pending" | "overdue";
export type PaymentMethod = "cash" | "card" | "bank_transfer" | "gcash" | "other";
export type PlanType = "daily" | "monthly" | "yearly";
export type BookingStatus = "confirmed" | "cancelled" | "waitlisted";
export type InvitationStatus = "sent" | "accepted" | "expired";

export interface Invitation {
  id: string;
  email: string;
  full_name: string;
  plan_id: string;
  token: string;
  status: InvitationStatus;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          phone: string | null;
          role: UserRole;
          avatar_url: string | null;
          qr_code_url: string | null;
          emergency_contact: string | null;
          health_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          qr_code_url?: string | null;
          emergency_contact?: string | null;
          health_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          qr_code_url?: string | null;
          emergency_contact?: string | null;
          health_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      membership_plans: {
        Row: {
          id: string;
          name: string;
          type: PlanType;
          price: number;
          duration_days: number;
          description: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: PlanType;
          price: number;
          duration_days: number;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: PlanType;
          price?: number;
          duration_days?: number;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          id: string;
          member_id: string;
          plan_id: string;
          start_date: string;
          end_date: string;
          status: MembershipStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          plan_id: string;
          start_date: string;
          end_date: string;
          status?: MembershipStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          plan_id?: string;
          start_date?: string;
          end_date?: string;
          status?: MembershipStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memberships_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "membership_plans";
            referencedColumns: ["id"];
          }
        ];
      };
      sessions: {
        Row: {
          id: string;
          title: string;
          trainer_id: string | null;
          date: string;
          start_time: string;
          end_time: string;
          capacity: number;
          description: string | null;
          recurring: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          trainer_id?: string | null;
          date: string;
          start_time: string;
          end_time: string;
          capacity: number;
          description?: string | null;
          recurring?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          trainer_id?: string | null;
          date?: string;
          start_time?: string;
          end_time?: string;
          capacity?: number;
          description?: string | null;
          recurring?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_trainer_id_fkey";
            columns: ["trainer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      session_bookings: {
        Row: {
          id: string;
          session_id: string;
          member_id: string;
          status: BookingStatus;
          booked_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          member_id: string;
          status?: BookingStatus;
          booked_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          member_id?: string;
          status?: BookingStatus;
          booked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "session_bookings_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "session_bookings_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      attendance: {
        Row: {
          id: string;
          member_id: string;
          check_in_time: string;
          check_out_time: string | null;
          session_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          check_in_time: string;
          check_out_time?: string | null;
          session_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          check_in_time?: string;
          check_out_time?: string | null;
          session_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      payments: {
        Row: {
          id: string;
          member_id: string;
          membership_id: string | null;
          amount: number;
          method: PaymentMethod;
          status: PaymentStatus;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          membership_id?: string | null;
          amount: number;
          method: PaymentMethod;
          status?: PaymentStatus;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          membership_id?: string | null;
          amount?: number;
          method?: PaymentMethod;
          status?: PaymentStatus;
          paid_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_membership_id_fkey";
            columns: ["membership_id"];
            isOneToOne: false;
            referencedRelation: "memberships";
            referencedColumns: ["id"];
          }
        ];
      };
      trainers: {
        Row: {
          id: string;
          profile_id: string;
          specialization: string | null;
          certifications: string[] | null;
          bio: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          specialization?: string | null;
          certifications?: string[] | null;
          bio?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          specialization?: string | null;
          certifications?: string[] | null;
          bio?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trainers_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      invitations: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          plan_id: string;
          token: string;
          status: InvitationStatus;
          invited_by: string;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name: string;
          plan_id: string;
          token: string;
          status?: InvitationStatus;
          invited_by: string;
          expires_at: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          plan_id?: string;
          token?: string;
          status?: InvitationStatus;
          invited_by?: string;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "membership_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      membership_status: MembershipStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      plan_type: PlanType;
      booking_status: BookingStatus;
      invitation_status: InvitationStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
