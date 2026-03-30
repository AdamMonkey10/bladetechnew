export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      archive_shift_records: {
        Row: {
          activities: Json | null
          archive_reason: string | null
          archived_at: string
          boxes_produced: number | null
          created_at: string | null
          downtime_minutes: number | null
          downtime_reason: string | null
          end_time: string | null
          id: string
          machine_id: string | null
          machine_name: string | null
          notes: string | null
          operator_id: string | null
          operator_name: string | null
          original_id: string | null
          product_code: string | null
          production_data: Json | null
          setup_time_minutes: number | null
          shift_date: string | null
          shift_type: string | null
          sku: string | null
          start_time: string | null
          total_hours: number | null
          user_id: string | null
          week_number: number | null
          year: number | null
        }
        Insert: {
          activities?: Json | null
          archive_reason?: string | null
          archived_at?: string
          boxes_produced?: number | null
          created_at?: string | null
          downtime_minutes?: number | null
          downtime_reason?: string | null
          end_time?: string | null
          id?: string
          machine_id?: string | null
          machine_name?: string | null
          notes?: string | null
          operator_id?: string | null
          operator_name?: string | null
          original_id?: string | null
          product_code?: string | null
          production_data?: Json | null
          setup_time_minutes?: number | null
          shift_date?: string | null
          shift_type?: string | null
          sku?: string | null
          start_time?: string | null
          total_hours?: number | null
          user_id?: string | null
          week_number?: number | null
          year?: number | null
        }
        Update: {
          activities?: Json | null
          archive_reason?: string | null
          archived_at?: string
          boxes_produced?: number | null
          created_at?: string | null
          downtime_minutes?: number | null
          downtime_reason?: string | null
          end_time?: string | null
          id?: string
          machine_id?: string | null
          machine_name?: string | null
          notes?: string | null
          operator_id?: string | null
          operator_name?: string | null
          original_id?: string | null
          product_code?: string | null
          production_data?: Json | null
          setup_time_minutes?: number | null
          shift_date?: string | null
          shift_type?: string | null
          sku?: string | null
          start_time?: string | null
          total_hours?: number | null
          user_id?: string | null
          week_number?: number | null
          year?: number | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_logs: {
        Row: {
          action_type: string
          backup_date: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          file_path: string | null
          file_size_bytes: number | null
          github_url: string | null
          id: string
          status: string
          tables_included: Json | null
        }
        Insert: {
          action_type?: string
          backup_date: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          github_url?: string | null
          id?: string
          status?: string
          tables_included?: Json | null
        }
        Update: {
          action_type?: string
          backup_date?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          file_path?: string | null
          file_size_bytes?: number | null
          github_url?: string | null
          id?: string
          status?: string
          tables_included?: Json | null
        }
        Relationships: []
      }
      box_number_sequences: {
        Row: {
          created_at: string
          id: string
          last_box_number: number | null
          po: string
          sku: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_box_number?: number | null
          po: string
          sku: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_box_number?: number | null
          po?: string
          sku?: string
          updated_at?: string
        }
        Relationships: []
      }
      calibration_records: {
        Row: {
          calibration_data: Json | null
          calibration_date: string
          created_at: string
          created_by: string | null
          equipment_id: string | null
          equipment_name: string
          equipment_serial: string | null
          id: string
          next_calibration_date: string | null
          notes: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          calibration_data?: Json | null
          calibration_date: string
          created_at?: string
          created_by?: string | null
          equipment_id?: string | null
          equipment_name: string
          equipment_serial?: string | null
          id?: string
          next_calibration_date?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          calibration_data?: Json | null
          calibration_date?: string
          created_at?: string
          created_by?: string | null
          equipment_id?: string | null
          equipment_name?: string
          equipment_serial?: string | null
          id?: string
          next_calibration_date?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calibration_records_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      clockfy_employee_mapping: {
        Row: {
          clockfy_employee_id: string
          confidence_score: number | null
          created_at: string
          created_by: string | null
          id: string
          mapping_type: string
          operator_id: string
          updated_at: string
        }
        Insert: {
          clockfy_employee_id: string
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          mapping_type?: string
          operator_id: string
          updated_at?: string
        }
        Update: {
          clockfy_employee_id?: string
          confidence_score?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          mapping_type?: string
          operator_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clockfy_employee_mapping_clockfy_employee_id_fkey"
            columns: ["clockfy_employee_id"]
            isOneToOne: false
            referencedRelation: "clockfy_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clockfy_employee_mapping_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      clockfy_employees: {
        Row: {
          clockfy_employee_id: string
          created_at: string
          deactivated_at: string | null
          email: string | null
          id: string
          is_active: boolean
          mapped_operator_id: string | null
          name: string
          pin: string | null
          updated_at: string
        }
        Insert: {
          clockfy_employee_id: string
          created_at?: string
          deactivated_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          mapped_operator_id?: string | null
          name: string
          pin?: string | null
          updated_at?: string
        }
        Update: {
          clockfy_employee_id?: string
          created_at?: string
          deactivated_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          mapped_operator_id?: string | null
          name?: string
          pin?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clockfy_employees_mapped_operator_id_fkey"
            columns: ["mapped_operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      clockfy_shift_assignments: {
        Row: {
          clockfy_assignment_id: string
          created_at: string
          employee_id: string | null
          end_date: string | null
          id: string
          shift_pattern: Json | null
          shift_template_id: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          clockfy_assignment_id: string
          created_at?: string
          employee_id?: string | null
          end_date?: string | null
          id?: string
          shift_pattern?: Json | null
          shift_template_id?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          clockfy_assignment_id?: string
          created_at?: string
          employee_id?: string | null
          end_date?: string | null
          id?: string
          shift_pattern?: Json | null
          shift_template_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clockfy_shift_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "clockfy_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      clockfy_sync_log: {
        Row: {
          created_at: string
          error_message: string | null
          event_id: string | null
          event_type: string
          id: string
          raw_payload: Json | null
          records_processed: number | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          raw_payload?: Json | null
          records_processed?: number | null
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          raw_payload?: Json | null
          records_processed?: number | null
          status?: string
        }
        Relationships: []
      }
      clockfy_time_events: {
        Row: {
          clock_in: string
          clock_out: string | null
          clockfy_record_id: string
          created_at: string
          employee_id: string | null
          id: string
          operator_id: string | null
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          clock_in: string
          clock_out?: string | null
          clockfy_record_id: string
          created_at?: string
          employee_id?: string | null
          id?: string
          operator_id?: string | null
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          clockfy_record_id?: string
          created_at?: string
          employee_id?: string | null
          id?: string
          operator_id?: string | null
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clockfy_time_events_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "clockfy_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clockfy_time_events_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_pos: {
        Row: {
          boxes_printed: number | null
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_template_id: string | null
          delivery_date: string | null
          id: string
          items: Json | null
          line_item_progress: Json | null
          notes: string | null
          order_quantity: number | null
          po_date: string
          po_number: string
          priority: string | null
          produced_quantity: number | null
          progress: number | null
          progress_percentage: number | null
          quantity: number | null
          sku: string | null
          status: string | null
          total_amount: number | null
          total_printed: number | null
          updated_at: string
          user_id: string | null
          warehouse_quantity_moved: number | null
          warehouse_status: string | null
        }
        Insert: {
          boxes_printed?: number | null
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_template_id?: string | null
          delivery_date?: string | null
          id?: string
          items?: Json | null
          line_item_progress?: Json | null
          notes?: string | null
          order_quantity?: number | null
          po_date: string
          po_number: string
          priority?: string | null
          produced_quantity?: number | null
          progress?: number | null
          progress_percentage?: number | null
          quantity?: number | null
          sku?: string | null
          status?: string | null
          total_amount?: number | null
          total_printed?: number | null
          updated_at?: string
          user_id?: string | null
          warehouse_quantity_moved?: number | null
          warehouse_status?: string | null
        }
        Update: {
          boxes_printed?: number | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_template_id?: string | null
          delivery_date?: string | null
          id?: string
          items?: Json | null
          line_item_progress?: Json | null
          notes?: string | null
          order_quantity?: number | null
          po_date?: string
          po_number?: string
          priority?: string | null
          produced_quantity?: number | null
          progress?: number | null
          progress_percentage?: number | null
          quantity?: number | null
          sku?: string | null
          status?: string | null
          total_amount?: number | null
          total_printed?: number | null
          updated_at?: string
          user_id?: string | null
          warehouse_quantity_moved?: number | null
          warehouse_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_pos_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_pos_customer_template_id_fkey"
            columns: ["customer_template_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          active: boolean | null
          address: string | null
          code: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          customer_name: string | null
          id: string
          is_active: boolean | null
          logo_position: Json | null
          logo_url: string | null
          name: string
          notes: string | null
          template_name: string | null
          updated_at: string
          zpl_code: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          code?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          is_active?: boolean | null
          logo_position?: Json | null
          logo_url?: string | null
          name: string
          notes?: string | null
          template_name?: string | null
          updated_at?: string
          zpl_code?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          code?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          is_active?: boolean | null
          logo_position?: Json | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          template_name?: string | null
          updated_at?: string
          zpl_code?: string | null
        }
        Relationships: []
      }
      equipment: {
        Row: {
          calibration_frequency_months: number | null
          created_at: string
          created_by: string | null
          equipment_name: string
          equipment_serial: string | null
          equipment_type: string | null
          id: string
          manufacturer: string | null
          model: string | null
          notes: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          calibration_frequency_months?: number | null
          created_at?: string
          created_by?: string | null
          equipment_name: string
          equipment_serial?: string | null
          equipment_type?: string | null
          id?: string
          manufacturer?: string | null
          model?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          calibration_frequency_months?: number | null
          created_at?: string
          created_by?: string | null
          equipment_name?: string
          equipment_serial?: string | null
          equipment_type?: string | null
          id?: string
          manufacturer?: string | null
          model?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      goods_out: {
        Row: {
          created_at: string
          customer: string | null
          dispatch_date: string
          id: string
          notes: string | null
          po_number: string | null
          quantity: number
          sku: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer?: string | null
          dispatch_date?: string
          id?: string
          notes?: string | null
          po_number?: string | null
          quantity?: number
          sku?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer?: string | null
          dispatch_date?: string
          id?: string
          notes?: string | null
          po_number?: string | null
          quantity?: number
          sku?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      goods_received: {
        Row: {
          created_at: string
          gauge: number | null
          good_status: boolean | null
          height: number | null
          id: string
          invoice: string | null
          notes: string | null
          pallet_number: number | null
          quantity_received: number
          rake_angle: number | null
          received_date: string
          reference_number: string | null
          set_left_1: number | null
          set_left_2: number | null
          set_left_avg: number | null
          set_right_1: number | null
          set_right_2: number | null
          set_right_avg: number | null
          sku: string | null
          stock_item_id: string | null
          supplier: string | null
          tooth_pitch: number | null
          user_id: string | null
          warehouse_quantity_moved: number | null
          warehouse_status: string | null
          width: number | null
        }
        Insert: {
          created_at?: string
          gauge?: number | null
          good_status?: boolean | null
          height?: number | null
          id?: string
          invoice?: string | null
          notes?: string | null
          pallet_number?: number | null
          quantity_received?: number
          rake_angle?: number | null
          received_date?: string
          reference_number?: string | null
          set_left_1?: number | null
          set_left_2?: number | null
          set_left_avg?: number | null
          set_right_1?: number | null
          set_right_2?: number | null
          set_right_avg?: number | null
          sku?: string | null
          stock_item_id?: string | null
          supplier?: string | null
          tooth_pitch?: number | null
          user_id?: string | null
          warehouse_quantity_moved?: number | null
          warehouse_status?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string
          gauge?: number | null
          good_status?: boolean | null
          height?: number | null
          id?: string
          invoice?: string | null
          notes?: string | null
          pallet_number?: number | null
          quantity_received?: number
          rake_angle?: number | null
          received_date?: string
          reference_number?: string | null
          set_left_1?: number | null
          set_left_2?: number | null
          set_left_avg?: number | null
          set_right_1?: number | null
          set_right_2?: number | null
          set_right_avg?: number | null
          sku?: string | null
          stock_item_id?: string | null
          supplier?: string | null
          tooth_pitch?: number | null
          user_id?: string | null
          warehouse_quantity_moved?: number | null
          warehouse_status?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goods_received_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      label_printing_sessions: {
        Row: {
          created_at: string
          end_box: number | null
          id: string
          po: string | null
          sku: string
          start_box: number | null
          total_labels: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          end_box?: number | null
          id?: string
          po?: string | null
          sku: string
          start_box?: number | null
          total_labels?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          end_box?: number | null
          id?: string
          po?: string | null
          sku?: string
          start_box?: number | null
          total_labels?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      machines: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          machine_code: string
          machine_name: string
          machine_type: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          machine_code: string
          machine_name: string
          machine_type?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          machine_code?: string
          machine_name?: string
          machine_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      milwaukee_test_reports: {
        Row: {
          created_at: string
          defect_rate: number | null
          id: string
          machine_id: string | null
          notes: string | null
          operator_id: string | null
          po: string | null
          product_id: string | null
          shift: string | null
          test_data: Json | null
          test_date: string
          total_defects: number | null
          total_saws: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          defect_rate?: number | null
          id?: string
          machine_id?: string | null
          notes?: string | null
          operator_id?: string | null
          po?: string | null
          product_id?: string | null
          shift?: string | null
          test_data?: Json | null
          test_date: string
          total_defects?: number | null
          total_saws?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          defect_rate?: number | null
          id?: string
          machine_id?: string | null
          notes?: string | null
          operator_id?: string | null
          po?: string | null
          product_id?: string | null
          shift?: string | null
          test_data?: Json | null
          test_date?: string
          total_defects?: number | null
          total_saws?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milwaukee_test_reports_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milwaukee_test_reports_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milwaukee_test_reports_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      oee_daily_summary: {
        Row: {
          actual_run_time_minutes: number | null
          availability: number | null
          created_at: string
          defect_pieces: number | null
          downtime_minutes: number | null
          good_pieces: number | null
          id: string
          machine_id: string | null
          machine_name: string | null
          notes: string | null
          oee: number | null
          operator_count: number | null
          performance: number | null
          planned_time_minutes: number | null
          quality: number | null
          setup_minutes: number | null
          shift_count: number | null
          sku_count: number | null
          summary_date: string
          total_pieces: number | null
          updated_at: string
          week_number: number | null
          year: number | null
        }
        Insert: {
          actual_run_time_minutes?: number | null
          availability?: number | null
          created_at?: string
          defect_pieces?: number | null
          downtime_minutes?: number | null
          good_pieces?: number | null
          id?: string
          machine_id?: string | null
          machine_name?: string | null
          notes?: string | null
          oee?: number | null
          operator_count?: number | null
          performance?: number | null
          planned_time_minutes?: number | null
          quality?: number | null
          setup_minutes?: number | null
          shift_count?: number | null
          sku_count?: number | null
          summary_date: string
          total_pieces?: number | null
          updated_at?: string
          week_number?: number | null
          year?: number | null
        }
        Update: {
          actual_run_time_minutes?: number | null
          availability?: number | null
          created_at?: string
          defect_pieces?: number | null
          downtime_minutes?: number | null
          good_pieces?: number | null
          id?: string
          machine_id?: string | null
          machine_name?: string | null
          notes?: string | null
          oee?: number | null
          operator_count?: number | null
          performance?: number | null
          planned_time_minutes?: number | null
          quality?: number | null
          setup_minutes?: number | null
          shift_count?: number | null
          sku_count?: number | null
          summary_date?: string
          total_pieces?: number | null
          updated_at?: string
          week_number?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "oee_daily_summary_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          active: boolean | null
          clockfy_id: string | null
          created_at: string
          id: string
          operator_code: string
          operator_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          clockfy_id?: string | null
          created_at?: string
          id?: string
          operator_code: string
          operator_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          clockfy_id?: string | null
          created_at?: string
          id?: string
          operator_code?: string
          operator_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      pallet_assignments: {
        Row: {
          assigned_at: string
          id: string
          pallet_id: string | null
          printed_label_id: string | null
        }
        Insert: {
          assigned_at?: string
          id?: string
          pallet_id?: string | null
          printed_label_id?: string | null
        }
        Update: {
          assigned_at?: string
          id?: string
          pallet_id?: string | null
          printed_label_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pallet_assignments_pallet_id_fkey"
            columns: ["pallet_id"]
            isOneToOne: false
            referencedRelation: "pallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pallet_assignments_printed_label_id_fkey"
            columns: ["printed_label_id"]
            isOneToOne: false
            referencedRelation: "printed_labels"
            referencedColumns: ["id"]
          },
        ]
      }
      pallet_number_sequences: {
        Row: {
          created_at: string
          id: string
          last_number: number | null
          prefix: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_number?: number | null
          prefix?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_number?: number | null
          prefix?: string
          updated_at?: string
        }
        Relationships: []
      }
      pallets: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          pallet_number: string
          po: string | null
          sku: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          pallet_number: string
          po?: string | null
          sku?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          pallet_number?: string
          po?: string | null
          sku?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      printed_labels: {
        Row: {
          box_number: number | null
          created_at: string
          date_printed: string | null
          goods_received_id: string | null
          id: string
          invoice: string | null
          line_item_index: number | null
          line_number: number | null
          po: string | null
          quantity: number | null
          session_id: string | null
          sku: string
          user_id: string | null
        }
        Insert: {
          box_number?: number | null
          created_at?: string
          date_printed?: string | null
          goods_received_id?: string | null
          id?: string
          invoice?: string | null
          line_item_index?: number | null
          line_number?: number | null
          po?: string | null
          quantity?: number | null
          session_id?: string | null
          sku: string
          user_id?: string | null
        }
        Update: {
          box_number?: number | null
          created_at?: string
          date_printed?: string | null
          goods_received_id?: string | null
          id?: string
          invoice?: string | null
          line_item_index?: number | null
          line_number?: number | null
          po?: string | null
          quantity?: number | null
          session_id?: string | null
          sku?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "printed_labels_goods_received_id_fkey"
            columns: ["goods_received_id"]
            isOneToOne: false
            referencedRelation: "goods_received"
            referencedColumns: ["id"]
          },
        ]
      }
      printer_settings: {
        Row: {
          created_at: string
          id: string
          label_height: number | null
          label_height_mm: number | null
          label_width: number | null
          label_width_mm: number | null
          printer_ip: string
          printer_port: number
          template_name: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          label_height?: number | null
          label_height_mm?: number | null
          label_width?: number | null
          label_width_mm?: number | null
          printer_ip?: string
          printer_port?: number
          template_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          label_height?: number | null
          label_height_mm?: number | null
          label_width?: number | null
          label_width_mm?: number | null
          printer_ip?: string
          printer_port?: number
          template_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_materials: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          product_id: string | null
          quantity_required: number | null
          raw_material_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity_required?: number | null
          raw_material_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity_required?: number | null
          raw_material_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_materials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_materials_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      product_specifications: {
        Row: {
          blade_body_max: number | null
          blade_body_min: number | null
          blade_body_target: number | null
          blade_bottom_max: number | null
          blade_bottom_min: number | null
          blade_bottom_target: number | null
          blade_width_max: number | null
          blade_width_min: number | null
          blade_width_target: number | null
          clearance_angle_max: number | null
          clearance_angle_min: number | null
          clearance_angle_target: number | null
          created_at: string
          dross_max: number | null
          dross_min: number | null
          dross_target: number | null
          flatness_max: number | null
          flatness_min: number | null
          flatness_target: number | null
          gauge_max: number | null
          gauge_min: number | null
          gauge_target: number | null
          height_max: number | null
          height_min: number | null
          height_target: number | null
          id: string
          kerf_max: number | null
          kerf_min: number | null
          kerf_target: number | null
          product_code: string
          product_id: string | null
          rake_angle_max: number | null
          rake_angle_min: number | null
          rake_angle_target: number | null
          set_left_max: number | null
          set_left_min: number | null
          set_left_target: number | null
          set_right_max: number | null
          set_right_min: number | null
          set_right_target: number | null
          tooth_pitch_max: number | null
          tooth_pitch_min: number | null
          tooth_pitch_target: number | null
          tooth_set_max: number | null
          tooth_set_min: number | null
          tooth_set_target: number | null
          updated_at: string
        }
        Insert: {
          blade_body_max?: number | null
          blade_body_min?: number | null
          blade_body_target?: number | null
          blade_bottom_max?: number | null
          blade_bottom_min?: number | null
          blade_bottom_target?: number | null
          blade_width_max?: number | null
          blade_width_min?: number | null
          blade_width_target?: number | null
          clearance_angle_max?: number | null
          clearance_angle_min?: number | null
          clearance_angle_target?: number | null
          created_at?: string
          dross_max?: number | null
          dross_min?: number | null
          dross_target?: number | null
          flatness_max?: number | null
          flatness_min?: number | null
          flatness_target?: number | null
          gauge_max?: number | null
          gauge_min?: number | null
          gauge_target?: number | null
          height_max?: number | null
          height_min?: number | null
          height_target?: number | null
          id?: string
          kerf_max?: number | null
          kerf_min?: number | null
          kerf_target?: number | null
          product_code: string
          product_id?: string | null
          rake_angle_max?: number | null
          rake_angle_min?: number | null
          rake_angle_target?: number | null
          set_left_max?: number | null
          set_left_min?: number | null
          set_left_target?: number | null
          set_right_max?: number | null
          set_right_min?: number | null
          set_right_target?: number | null
          tooth_pitch_max?: number | null
          tooth_pitch_min?: number | null
          tooth_pitch_target?: number | null
          tooth_set_max?: number | null
          tooth_set_min?: number | null
          tooth_set_target?: number | null
          updated_at?: string
        }
        Update: {
          blade_body_max?: number | null
          blade_body_min?: number | null
          blade_body_target?: number | null
          blade_bottom_max?: number | null
          blade_bottom_min?: number | null
          blade_bottom_target?: number | null
          blade_width_max?: number | null
          blade_width_min?: number | null
          blade_width_target?: number | null
          clearance_angle_max?: number | null
          clearance_angle_min?: number | null
          clearance_angle_target?: number | null
          created_at?: string
          dross_max?: number | null
          dross_min?: number | null
          dross_target?: number | null
          flatness_max?: number | null
          flatness_min?: number | null
          flatness_target?: number | null
          gauge_max?: number | null
          gauge_min?: number | null
          gauge_target?: number | null
          height_max?: number | null
          height_min?: number | null
          height_target?: number | null
          id?: string
          kerf_max?: number | null
          kerf_min?: number | null
          kerf_target?: number | null
          product_code?: string
          product_id?: string | null
          rake_angle_max?: number | null
          rake_angle_min?: number | null
          rake_angle_target?: number | null
          set_left_max?: number | null
          set_left_min?: number | null
          set_left_target?: number | null
          set_right_max?: number | null
          set_right_min?: number | null
          set_right_target?: number | null
          tooth_pitch_max?: number | null
          tooth_pitch_min?: number | null
          tooth_pitch_target?: number | null
          tooth_set_max?: number | null
          tooth_set_min?: number | null
          tooth_set_target?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_specifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          box_amount: number | null
          created_at: string
          description: string | null
          id: string
          packing_instructions: string | null
          product_code: string
          product_name: string
          revision: string | null
          updated_at: string
        }
        Insert: {
          box_amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          packing_instructions?: string | null
          product_code: string
          product_name: string
          revision?: string | null
          updated_at?: string
        }
        Update: {
          box_amount?: number | null
          created_at?: string
          description?: string | null
          id?: string
          packing_instructions?: string | null
          product_code?: string
          product_name?: string
          revision?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      raw_material_specifications: {
        Row: {
          created_at: string
          gauge_max: number | null
          gauge_min: number | null
          height_max: number | null
          height_min: number | null
          id: string
          material_code: string
          set_left_max: number | null
          set_left_min: number | null
          set_right_max: number | null
          set_right_min: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          gauge_max?: number | null
          gauge_min?: number | null
          height_max?: number | null
          height_min?: number | null
          id?: string
          material_code: string
          set_left_max?: number | null
          set_left_min?: number | null
          set_right_max?: number | null
          set_right_min?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          gauge_max?: number | null
          gauge_min?: number | null
          height_max?: number | null
          height_min?: number | null
          id?: string
          material_code?: string
          set_left_max?: number | null
          set_left_min?: number | null
          set_right_max?: number | null
          set_right_min?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      raw_materials: {
        Row: {
          created_at: string
          description: string | null
          id: string
          material_code: string
          material_name: string
          revision: string | null
          specification_date: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          material_code: string
          material_name: string
          revision?: string | null
          specification_date?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          material_code?: string
          material_name?: string
          revision?: string | null
          specification_date?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recipient_group_members: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          recipient_id: string | null
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          recipient_id?: string | null
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          recipient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipient_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "report_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipient_group_members_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "report_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      registered_devices: {
        Row: {
          device_fingerprint: string
          device_name: string
          id: string
          is_active: boolean
          last_used_at: string | null
          location: string | null
          registered_at: string
        }
        Insert: {
          device_fingerprint: string
          device_name: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          location?: string | null
          registered_at?: string
        }
        Update: {
          device_fingerprint?: string
          device_name?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          location?: string | null
          registered_at?: string
        }
        Relationships: []
      }
      report_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      report_recipients: {
        Row: {
          active: boolean | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      shift_records: {
        Row: {
          activities: Json | null
          boxes_produced: number | null
          created_at: string
          downtime_minutes: number | null
          downtime_reason: string | null
          end_time: string | null
          end_timestamp: string | null
          id: string
          machine_id: string | null
          machine_name: string | null
          notes: string | null
          operator_id: string | null
          operator_name: string | null
          product_code: string | null
          production_data: Json | null
          setup_time_minutes: number | null
          shift_date: string
          shift_type: string
          sku: string | null
          start_time: string | null
          start_timestamp: string | null
          total_hours: number | null
          user_id: string | null
          week_number: number | null
          year: number | null
        }
        Insert: {
          activities?: Json | null
          boxes_produced?: number | null
          created_at?: string
          downtime_minutes?: number | null
          downtime_reason?: string | null
          end_time?: string | null
          end_timestamp?: string | null
          id?: string
          machine_id?: string | null
          machine_name?: string | null
          notes?: string | null
          operator_id?: string | null
          operator_name?: string | null
          product_code?: string | null
          production_data?: Json | null
          setup_time_minutes?: number | null
          shift_date: string
          shift_type: string
          sku?: string | null
          start_time?: string | null
          start_timestamp?: string | null
          total_hours?: number | null
          user_id?: string | null
          week_number?: number | null
          year?: number | null
        }
        Update: {
          activities?: Json | null
          boxes_produced?: number | null
          created_at?: string
          downtime_minutes?: number | null
          downtime_reason?: string | null
          end_time?: string | null
          end_timestamp?: string | null
          id?: string
          machine_id?: string | null
          machine_name?: string | null
          notes?: string | null
          operator_id?: string | null
          operator_name?: string | null
          product_code?: string | null
          production_data?: Json | null
          setup_time_minutes?: number | null
          shift_date?: string
          shift_type?: string
          sku?: string | null
          start_time?: string | null
          start_timestamp?: string | null
          total_hours?: number | null
          user_id?: string | null
          week_number?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_records_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_records_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          item_code: string
          item_name: string
          location: string | null
          minimum_stock: number | null
          quantity: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          item_code: string
          item_name: string
          location?: string | null
          minimum_stock?: number | null
          quantity?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          item_code?: string
          item_name?: string
          location?: string | null
          minimum_stock?: number | null
          quantity?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      timesheet_tracking: {
        Row: {
          actual_shifts: number | null
          compliance_rate: number | null
          created_at: string
          days_overdue: number | null
          escalation_level: string | null
          expected_shifts: number | null
          id: string
          last_updated: string | null
          missing_shifts: number | null
          operator_id: string | null
          operator_name: string | null
          status: string | null
          timesheet_submitted: boolean | null
          timesheet_submitted_at: string | null
          week_number: number
          year: number
        }
        Insert: {
          actual_shifts?: number | null
          compliance_rate?: number | null
          created_at?: string
          days_overdue?: number | null
          escalation_level?: string | null
          expected_shifts?: number | null
          id?: string
          last_updated?: string | null
          missing_shifts?: number | null
          operator_id?: string | null
          operator_name?: string | null
          status?: string | null
          timesheet_submitted?: boolean | null
          timesheet_submitted_at?: string | null
          week_number: number
          year: number
        }
        Update: {
          actual_shifts?: number | null
          compliance_rate?: number | null
          created_at?: string
          days_overdue?: number | null
          escalation_level?: string | null
          expected_shifts?: number | null
          id?: string
          last_updated?: string | null
          missing_shifts?: number | null
          operator_id?: string | null
          operator_name?: string | null
          status?: string | null
          timesheet_submitted?: boolean | null
          timesheet_submitted_at?: string | null
          week_number?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "timesheet_tracking_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_aisles: {
        Row: {
          code: string
          created_at: string
          id: string
          label: string | null
          layout_id: string | null
          sort_order: number | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          label?: string | null
          layout_id?: string | null
          sort_order?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          label?: string | null
          layout_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_aisles_layout_id_fkey"
            columns: ["layout_id"]
            isOneToOne: false
            referencedRelation: "warehouse_layouts"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_bays: {
        Row: {
          aisle_id: string | null
          code: string
          created_at: string
          id: string
          label: string | null
          sort_order: number | null
        }
        Insert: {
          aisle_id?: string | null
          code: string
          created_at?: string
          id?: string
          label?: string | null
          sort_order?: number | null
        }
        Update: {
          aisle_id?: string | null
          code?: string
          created_at?: string
          id?: string
          label?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_bays_aisle_id_fkey"
            columns: ["aisle_id"]
            isOneToOne: false
            referencedRelation: "warehouse_aisles"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_layouts: {
        Row: {
          config: Json
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      warehouse_levels: {
        Row: {
          bay_id: string | null
          code: string
          created_at: string
          id: string
          label: string | null
          max_weight_kg: number | null
          sort_order: number | null
        }
        Insert: {
          bay_id?: string | null
          code: string
          created_at?: string
          id?: string
          label?: string | null
          max_weight_kg?: number | null
          sort_order?: number | null
        }
        Update: {
          bay_id?: string | null
          code?: string
          created_at?: string
          id?: string
          label?: string | null
          max_weight_kg?: number | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_levels_bay_id_fkey"
            columns: ["bay_id"]
            isOneToOne: false
            referencedRelation: "warehouse_bays"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_locations: {
        Row: {
          code: string
          created_at: string
          id: string
          label: string | null
          level_id: string | null
          location_type: string | null
          max_weight_kg: number | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          label?: string | null
          level_id?: string | null
          location_type?: string | null
          max_weight_kg?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          label?: string | null
          level_id?: string | null
          location_type?: string | null
          max_weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_locations_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "warehouse_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          max_stock: number | null
          min_stock: number | null
          name: string
          sku: string
          unit: string | null
          updated_at: string
          weight_kg: number | null
          weight_per_unit_kg: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          max_stock?: number | null
          min_stock?: number | null
          name: string
          sku: string
          unit?: string | null
          updated_at?: string
          weight_kg?: number | null
          weight_per_unit_kg?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          max_stock?: number | null
          min_stock?: number | null
          name?: string
          sku?: string
          unit?: string | null
          updated_at?: string
          weight_kg?: number | null
          weight_per_unit_kg?: number | null
        }
        Relationships: []
      }
      warehouse_slot_inventory: {
        Row: {
          created_at: string
          id: string
          location_id: string | null
          product_id: string | null
          quantity: number
          slot_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id?: string | null
          product_id?: string | null
          quantity?: number
          slot_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string | null
          product_id?: string | null
          quantity?: number
          slot_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_slot_inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_slot_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "warehouse_products"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_stock_movements: {
        Row: {
          created_at: string
          from_location_id: string | null
          id: string
          movement_type: string
          notes: string | null
          product_id: string | null
          quantity: number
          reference: string | null
          to_location_id: string | null
          user_id: string | null
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          from_location_id?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          product_id?: string | null
          quantity: number
          reference?: string | null
          to_location_id?: string | null
          user_id?: string | null
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          from_location_id?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          reference?: string | null
          to_location_id?: string | null
          user_id?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_stock_movements_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "warehouse_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stock_movements_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reports: {
        Row: {
          created_at: string
          generated_by: string | null
          id: string
          report_data: Json | null
          sent_to: Json | null
          status: string | null
          updated_at: string
          week_number: number
          year: number
        }
        Insert: {
          created_at?: string
          generated_by?: string | null
          id?: string
          report_data?: Json | null
          sent_to?: Json | null
          status?: string | null
          updated_at?: string
          week_number: number
          year: number
        }
        Update: {
          created_at?: string
          generated_by?: string | null
          id?: string
          report_data?: Json | null
          sent_to?: Json | null
          status?: string | null
          updated_at?: string
          week_number?: number
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      analytics_summary: {
        Row: {
          boxes_produced: number | null
          downtime_minutes: number | null
          machine_name: string | null
          operator_name: string | null
          setup_time_minutes: number | null
          shift_date: string | null
          shift_type: string | null
          sku: string | null
          total_hours: number | null
          week_number: number | null
          year: number | null
        }
        Insert: {
          boxes_produced?: number | null
          downtime_minutes?: number | null
          machine_name?: string | null
          operator_name?: string | null
          setup_time_minutes?: number | null
          shift_date?: string | null
          shift_type?: string | null
          sku?: string | null
          total_hours?: number | null
          week_number?: number | null
          year?: number | null
        }
        Update: {
          boxes_produced?: number | null
          downtime_minutes?: number | null
          machine_name?: string | null
          operator_name?: string | null
          setup_time_minutes?: number | null
          shift_date?: string | null
          shift_type?: string | null
          sku?: string | null
          total_hours?: number | null
          week_number?: number | null
          year?: number | null
        }
        Relationships: []
      }
      goods_movements: {
        Row: {
          counterparty: string | null
          created_at: string | null
          direction: string | null
          id: string | null
          movement_date: string | null
          notes: string | null
          po_number: string | null
          quantity: number | null
          sku: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_daily_oee_summary: {
        Args: { target_date: string; target_rates: Json }
        Returns: undefined
      }
      delete_pallets_by_numbers: {
        Args: { pallet_numbers: string[] }
        Returns: number
      }
      delete_printed_labels_by_date: {
        Args: { target_date: string }
        Returns: number
      }
      fix_missing_hours: { Args: never; Returns: number }
      generate_next_box_number: {
        Args: { p_po: string; p_sku: string }
        Returns: number
      }
      generate_next_pallet_number: {
        Args: { p_prefix?: string }
        Returns: string
      }
      generate_weekly_production_report: {
        Args: { week_start_date: string }
        Returns: Json
      }
      get_data_quality_metrics: {
        Args: never
        Returns: {
          avg_hours: number
          data_completeness: number
          records_with_hours: number
          records_with_sku: number
          records_without_hours: number
          records_without_sku: number
          total_records: number
        }[]
      }
      get_stock_levels: {
        Args: never
        Returns: {
          net_stock: number
          sku: string
          total_in: number
          total_out: number
        }[]
      }
      populate_oee_summaries: {
        Args: { end_date: string; start_date: string; target_rates: Json }
        Returns: undefined
      }
      update_timesheet_tracking: {
        Args: { p_operator_id: string; p_week_number: number; p_year: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
