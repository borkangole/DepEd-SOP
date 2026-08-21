// Hand-authored types matching supabase/migrations/0001_init.sql.
// Once you have a live Supabase project, regenerate this with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/types/database.ts

export type UserRole = "teacher" | "school_admin" | "division" | "super_admin";
export type TransactionType = "authority_to_travel" | "leave_application";
export type LeaveKind = "maternity" | "leave_credits";
export type TransactionStatus =
  | "submitted"
  | "under_verification"
  | "for_correction"
  | "endorsed"
  | "under_processing"
  | "approved_completed"
  | "released";

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string;
          name: string;
          district: string | null;
          is_remote: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["schools"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["schools"]["Row"]>;
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          employee_id: string | null;
          role: UserRole;
          school_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string; full_name: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      sop_catalog: {
        Row: {
          id: string;
          transaction_type: TransactionType;
          title: string;
          purpose: string;
          requirements: string[];
          steps: string[];
          responsible_offices: string;
          processing_time_days: number;
          is_active: boolean;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sop_catalog"]["Row"]> & {
          transaction_type: TransactionType;
          title: string;
          purpose: string;
        };
        Update: Partial<Database["public"]["Tables"]["sop_catalog"]["Row"]>;
      };
      transactions: {
        Row: {
          id: string;
          transaction_type: TransactionType;
          leave_kind: LeaveKind | null;
          sop_catalog_id: string;
          teacher_id: string;
          school_id: string;
          details: Record<string, unknown>;
          current_status: TransactionStatus;
          submitted_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["transactions"]["Row"]> & {
          transaction_type: TransactionType;
          sop_catalog_id: string;
          teacher_id: string;
          school_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Row"]>;
      };
      transaction_documents: {
        Row: {
          id: string;
          transaction_id: string;
          storage_path: string;
          file_name: string;
          uploaded_by: string;
          uploaded_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["transaction_documents"]["Row"]> & {
          transaction_id: string;
          storage_path: string;
          file_name: string;
          uploaded_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["transaction_documents"]["Row"]>;
      };
      transaction_status_log: {
        Row: {
          id: string;
          transaction_id: string;
          status: TransactionStatus;
          changed_by: string;
          note: string | null;
          changed_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["transaction_status_log"]["Row"]> & {
          transaction_id: string;
          status: TransactionStatus;
          changed_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["transaction_status_log"]["Row"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          transaction_id: string | null;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          user_id: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
      };
    };
  };
}
