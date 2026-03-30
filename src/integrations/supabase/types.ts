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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      archive_shift_records: {
        Row: {
          archived_at: string
          archived_by: string | null
          created_at: string
          end_time: string | null
          id: string
          machine_id: string | null
          notes: string | null
          operator_id: string | null
          production_data: Json | null
          shift_date: string
          shift_type: string
          start_time: string | null
          user_id: string | null
        }
        Insert: {
          archived_at?: string
          archived_by?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          machine_id?: string | null
          notes?: string | null
          operator_id?: string | null
          production_data?: Json | null
          shift_date: string
          shift_type: string
          start_time?: string | null
          user_id?: string | null
        }
        Update: {
          archived_at?: string
          archived_by?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          machine_id?: string | null
          notes?: string | null
          operator_id?: string | null
          production_data?: Json | null
          shift_date?: string
          shift_type?: string
          start_time?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      box_number_sequences: {
        Row: {
          created_at: string
          current_number: number
          id: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          current_number?: number
          id?: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          current_number?: number
          id?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      calibration_records: {
        Row: {
          calibration_data: Json | null
          calibration_date: string
          created_at: string
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
          clockfy_id: string
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          processing_status: string
        }
        Insert: {
          clockfy_id: string
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_status?: string
        }
        Update: {
          clockfy_id?: string
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_status?: string
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
          customer_name: string
          customer_template_id: string | null
          delivery_date: string | null
          id: string
          items: Json | null
          line_item_progress: Json | null
          notes: string | null
          po_date: string
          po_number: string
          progress_percentage: number | null
          status: boolean | null
          total_printed: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          boxes_printed?: number | null
          created_at?: string
          customer_name: string
          customer_template_id?: string | null
          delivery_date?: string | null
          id?: string
          items?: Json | null
          line_item_progress?: Json | null
          notes?: string | null
          po_date: string
          po_number: string
          progress_percentage?: number | null
          status?: boolean | null
          total_printed?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          boxes_printed?: number | null
          created_at?: string
          customer_name?: string
          customer_template_id?: string | null
          delivery_date?: string | null
          id?: string
          items?: Json | null
          line_item_progress?: Json | null
          notes?: string | null
          po_date?: string
          po_number?: string
          progress_percentage?: number | null
          status?: boolean | null
          total_printed?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
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
          created_at: string
          customer_name: string
          id: string
          is_active: boolean
          logo_position: Json | null
          logo_url: string | null
          template_name: string | null
          updated_at: string
          zpl_code: string | null
        }
        Insert: {
          created_at?: string
          customer_name: string
          id?: string
          is_active?: boolean
          logo_position?: Json | null
          logo_url?: string | null
          template_name?: string | null
          updated_at?: string
          zpl_code?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string
          id?: string
          is_active?: boolean
          logo_position?: Json | null
          logo_url?: string | null
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
          customer_id: string | null
          destination: string | null
          dispatch_date: string
          id: string
          invoice: string | null
          notes: string | null
          quantity_dispatched: number
          raw_material_id: string | null
          reference_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          destination?: string | null
          dispatch_date?: string
          id?: string
          invoice?: string | null
          notes?: string | null
          quantity_dispatched?: number
          raw_material_id?: string | null
          reference_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          destination?: string | null
          dispatch_date?: string
          id?: string
          invoice?: string | null
          notes?: string | null
          quantity_dispatched?: number
          raw_material_id?: string | null
          reference_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goods_out_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_out_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
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
          raw_material_id: string | null
          received_date: string
          reference_number: string | null
          set_left_1: number | null
          set_left_2: number | null
          set_left_avg: number | null
          set_right_1: number | null
          set_right_2: number | null
          set_right_avg: number | null
          sku: string | null
          supplier: string | null
          user_id: string | null
          warehouse_quantity_moved: number | null
          warehouse_status: string | null
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
          quantity_received: number
          raw_material_id?: string | null
          received_date: string
          reference_number?: string | null
          set_left_1?: number | null
          set_left_2?: number | null
          set_left_avg?: number | null
          set_right_1?: number | null
          set_right_2?: number | null
          set_right_avg?: number | null
          sku?: string | null
          supplier?: string | null
          user_id?: string | null
          warehouse_quantity_moved?: number | null
          warehouse_status?: string | null
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
          raw_material_id?: string | null
          received_date?: string
          reference_number?: string | null
          set_left_1?: number | null
          set_left_2?: number | null
          set_left_avg?: number | null
          set_right_1?: number | null
          set_right_2?: number | null
          set_right_avg?: number | null
          sku?: string | null
          supplier?: string | null
          user_id?: string | null
          warehouse_quantity_moved?: number | null
          warehouse_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_goods_received_supplier"
            columns: ["supplier"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_received_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      label_printing_sessions: {
        Row: {
          created_at: string
          customer_po_id: string | null
          id: string
          invoice: string | null
          laser_machine_id: string
          operator_id: string | null
          quantity: number | null
          session_date: string
          sku: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_po_id?: string | null
          id?: string
          invoice?: string | null
          laser_machine_id: string
          operator_id?: string | null
          quantity?: number | null
          session_date?: string
          sku?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_po_id?: string | null
          id?: string
          invoice?: string | null
          laser_machine_id?: string
          operator_id?: string | null
          quantity?: number | null
          session_date?: string
          sku?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_customer_po"
            columns: ["customer_po_id"]
            isOneToOne: false
            referencedRelation: "customer_pos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_laser_machine"
            columns: ["laser_machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_operator"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
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
          goods_received_id: string | null
          id: string
          machine_id: string | null
          notes: string | null
          operator_id: string | null
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
          goods_received_id?: string | null
          id?: string
          machine_id?: string | null
          notes?: string | null
          operator_id?: string | null
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
          goods_received_id?: string | null
          id?: string
          machine_id?: string | null
          notes?: string | null
          operator_id?: string | null
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
            foreignKeyName: "milwaukee_test_reports_goods_received_id_fkey"
            columns: ["goods_received_id"]
            isOneToOne: false
            referencedRelation: "goods_received"
            referencedColumns: ["id"]
          },
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
          activity_type: string
          availability_247: number
          availability_booked: number
          booked_hours: number
          calculation_date: string
          created_at: string
          id: string
          oee_247: number
          oee_booked: number
          performance_247: number
          performance_booked: number
          quality: number
          target_rate_247: number
          target_rate_booked: number
          total_scrap: number
          total_time: number
          total_units: number
          updated_at: string
        }
        Insert: {
          activity_type: string
          availability_247?: number
          availability_booked?: number
          booked_hours?: number
          calculation_date: string
          created_at?: string
          id?: string
          oee_247?: number
          oee_booked?: number
          performance_247?: number
          performance_booked?: number
          quality?: number
          target_rate_247?: number
          target_rate_booked?: number
          total_scrap?: number
          total_time?: number
          total_units?: number
          updated_at?: string
        }
        Update: {
          activity_type?: string
          availability_247?: number
          availability_booked?: number
          booked_hours?: number
          calculation_date?: string
          created_at?: string
          id?: string
          oee_247?: number
          oee_booked?: number
          performance_247?: number
          performance_booked?: number
          quality?: number
          target_rate_247?: number
          target_rate_booked?: number
          total_scrap?: number
          total_time?: number
          total_units?: number
          updated_at?: string
        }
        Relationships: []
      }
      operators: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          operator_code: string
          operator_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          operator_code: string
          operator_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
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
          assigned_by: string
          id: string
          pallet_id: string
          printed_label_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          id?: string
          pallet_id: string
          printed_label_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          id?: string
          pallet_id?: string
          printed_label_id?: string
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
            isOneToOne: true
            referencedRelation: "printed_labels"
            referencedColumns: ["id"]
          },
        ]
      }
      pallet_number_sequences: {
        Row: {
          created_at: string
          current_number: number
          id: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          current_number?: number
          id?: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          current_number?: number
          id?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      pallets: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          current_count: number
          customer: string
          id: string
          max_capacity: number
          pallet_number: string
          po_number: string
          status: string
          total_quantity: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          current_count?: number
          customer: string
          id?: string
          max_capacity?: number
          pallet_number: string
          po_number: string
          status?: string
          total_quantity?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          current_count?: number
          customer?: string
          id?: string
          max_capacity?: number
          pallet_number?: string
          po_number?: string
          status?: string
          total_quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      printed_labels: {
        Row: {
          box_number: string | null
          created_at: string
          customer: string
          document_id: string | null
          id: string
          invoice: string | null
          laser: string
          line_item_index: number | null
          operator: string
          pallet_name: string | null
          po: string
          print_date: string
          quantity: number
          sku: string
          updated_at: string
          user_id: string
        }
        Insert: {
          box_number?: string | null
          created_at?: string
          customer: string
          document_id?: string | null
          id?: string
          invoice?: string | null
          laser: string
          line_item_index?: number | null
          operator: string
          pallet_name?: string | null
          po: string
          print_date: string
          quantity: number
          sku: string
          updated_at?: string
          user_id: string
        }
        Update: {
          box_number?: string | null
          created_at?: string
          customer?: string
          document_id?: string | null
          id?: string
          invoice?: string | null
          laser?: string
          line_item_index?: number | null
          operator?: string
          pallet_name?: string | null
          po?: string
          print_date?: string
          quantity?: number
          sku?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      printer_settings: {
        Row: {
          created_at: string
          id: string
          ip_address: string
          label_height_mm: number | null
          label_width_mm: number | null
          port: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string
          label_height_mm?: number | null
          label_width_mm?: number | null
          port?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
          label_height_mm?: number | null
          label_width_mm?: number | null
          port?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_materials: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          product_id: string
          quantity_required: number
          raw_material_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          quantity_required?: number
          raw_material_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity_required?: number
          raw_material_id?: string
          updated_at?: string
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
          product_code: string
          set_left_max: number | null
          set_left_min: number | null
          set_left_target: number | null
          set_right_max: number | null
          set_right_min: number | null
          set_right_target: number | null
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
          product_code: string
          set_left_max?: number | null
          set_left_min?: number | null
          set_left_target?: number | null
          set_right_max?: number | null
          set_right_min?: number | null
          set_right_target?: number | null
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
          product_code?: string
          set_left_max?: number | null
          set_left_min?: number | null
          set_left_target?: number | null
          set_right_max?: number | null
          set_right_min?: number | null
          set_right_target?: number | null
          tooth_set_max?: number | null
          tooth_set_min?: number | null
          tooth_set_target?: number | null
          updated_at?: string
        }
        Relationships: []
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
          gauge_target: number | null
          height_max: number | null
          height_min: number | null
          height_target: number | null
          id: string
          material_code: string
          set_left_max: number | null
          set_left_min: number | null
          set_left_target: number | null
          set_right_max: number | null
          set_right_min: number | null
          set_right_target: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          gauge_max?: number | null
          gauge_min?: number | null
          gauge_target?: number | null
          height_max?: number | null
          height_min?: number | null
          height_target?: number | null
          id?: string
          material_code: string
          set_left_max?: number | null
          set_left_min?: number | null
          set_left_target?: number | null
          set_right_max?: number | null
          set_right_min?: number | null
          set_right_target?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          gauge_max?: number | null
          gauge_min?: number | null
          gauge_target?: number | null
          height_max?: number | null
          height_min?: number | null
          height_target?: number | null
          id?: string
          material_code?: string
          set_left_max?: number | null
          set_left_min?: number | null
          set_left_target?: number | null
          set_right_max?: number | null
          set_right_min?: number | null
          set_right_target?: number | null
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
          updated_at?: string
        }
        Relationships: []
      }
      recipient_group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          recipient_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          recipient_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          recipient_id?: string
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
      report_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_recipients: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          email: string
          id: string
          name: string
          role: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          name: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          name?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shift_records: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          machine_id: string | null
          notes: string | null
          operator_id: string | null
          production_data: Json | null
          shift_date: string
          shift_type: string
          start_time: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          machine_id?: string | null
          notes?: string | null
          operator_id?: string | null
          production_data?: Json | null
          shift_date: string
          shift_type: string
          start_time?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          machine_id?: string | null
          notes?: string | null
          operator_id?: string | null
          production_data?: Json | null
          shift_date?: string
          shift_type?: string
          start_time?: string | null
          user_id?: string | null
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
          clockfy_events_exist: boolean | null
          created_at: string | null
          days_overdue: number | null
          escalation_level: string | null
          id: string
          operator_id: string
          timesheet_submitted: boolean | null
          timesheet_submitted_at: string | null
          updated_at: string | null
          work_date: string
        }
        Insert: {
          clockfy_events_exist?: boolean | null
          created_at?: string | null
          days_overdue?: number | null
          escalation_level?: string | null
          id?: string
          operator_id: string
          timesheet_submitted?: boolean | null
          timesheet_submitted_at?: string | null
          updated_at?: string | null
          work_date: string
        }
        Update: {
          clockfy_events_exist?: boolean | null
          created_at?: string | null
          days_overdue?: number | null
          escalation_level?: string | null
          id?: string
          operator_id?: string
          timesheet_submitted?: boolean | null
          timesheet_submitted_at?: string | null
          updated_at?: string | null
          work_date?: string
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
          created_at: string | null
          id: string
          layout_id: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          layout_id?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          layout_id?: string | null
          name?: string
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
          created_at: string | null
          id: string
          max_weight_kg: number | null
          name: string
        }
        Insert: {
          aisle_id?: string | null
          created_at?: string | null
          id?: string
          max_weight_kg?: number | null
          name: string
        }
        Update: {
          aisle_id?: string | null
          created_at?: string | null
          id?: string
          max_weight_kg?: number | null
          name?: string
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
          created_at: string
          created_by: string | null
          id: string
          layout_data: Json
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          layout_data: Json
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          layout_data?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      warehouse_levels: {
        Row: {
          code: string
          constraints: string[] | null
          created_at: string | null
          id: string
          level_number: number
          location_id: string | null
          max_weight_kg: number | null
        }
        Insert: {
          code: string
          constraints?: string[] | null
          created_at?: string | null
          id?: string
          level_number: number
          location_id?: string | null
          max_weight_kg?: number | null
        }
        Update: {
          code?: string
          constraints?: string[] | null
          created_at?: string | null
          id?: string
          level_number?: number
          location_id?: string | null
          max_weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_levels_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_locations: {
        Row: {
          bay_id: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          bay_id?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          bay_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_locations_bay_id_fkey"
            columns: ["bay_id"]
            isOneToOne: false
            referencedRelation: "warehouse_bays"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_products: {
        Row: {
          attributes: Json | null
          barcode: string | null
          created_at: string
          created_by: string | null
          dimensions_mm: Json | null
          expiry_date: string | null
          id: string
          max_qty: number | null
          min_qty: number | null
          name: string
          sku: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          attributes?: Json | null
          barcode?: string | null
          created_at?: string
          created_by?: string | null
          dimensions_mm?: Json | null
          expiry_date?: string | null
          id?: string
          max_qty?: number | null
          min_qty?: number | null
          name: string
          sku: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          attributes?: Json | null
          barcode?: string | null
          created_at?: string
          created_by?: string | null
          dimensions_mm?: Json | null
          expiry_date?: string | null
          id?: string
          max_qty?: number | null
          min_qty?: number | null
          name?: string
          sku?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      warehouse_slot_inventory: {
        Row: {
          created_at: string
          id: string
          last_updated_by: string | null
          product_id: string | null
          quantity: number
          slot_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated_by?: string | null
          product_id?: string | null
          quantity?: number
          slot_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_updated_by?: string | null
          product_id?: string | null
          quantity?: number
          slot_code?: string
          updated_at?: string
        }
        Relationships: [
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
          from_slot_code: string | null
          goods_received_id: string | null
          id: string
          movement_type: string
          notes: string | null
          performed_by: string | null
          product_id: string
          quantity: number
          to_slot_code: string | null
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          from_slot_code?: string | null
          goods_received_id?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          performed_by?: string | null
          product_id: string
          quantity: number
          to_slot_code?: string | null
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          from_slot_code?: string | null
          goods_received_id?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          performed_by?: string | null
          product_id?: string
          quantity?: number
          to_slot_code?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_stock_movements_goods_received_id_fkey"
            columns: ["goods_received_id"]
            isOneToOne: false
            referencedRelation: "goods_received"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "warehouse_products"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reports: {
        Row: {
          generated_at: string
          generated_by: string | null
          id: string
          report_data: Json
          status: string
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          generated_at?: string
          generated_by?: string | null
          id?: string
          report_data: Json
          status?: string
          week_end_date: string
          week_start_date: string
        }
        Update: {
          generated_at?: string
          generated_by?: string | null
          id?: string
          report_data?: Json
          status?: string
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      analytics_summary: {
        Row: {
          date: string | null
          laser_time: number | null
          laser_units: number | null
          operator_code: string | null
          operator_id: string | null
          operator_name: string | null
          total_scrap: number | null
          total_shifts: number | null
          total_time: number | null
          total_units: number | null
          welder_time: number | null
          welder_units: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_records_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_movements: {
        Row: {
          created_at: string | null
          id: string | null
          invoice: string | null
          movement_date: string | null
          movement_type: string | null
          notes: string | null
          partner: string | null
          quantity: number | null
          raw_material_id: string | null
          reference_number: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_daily_oee_summary: {
        Args: { target_date: string; target_rates: Json }
        Returns: undefined
      }
      calculate_daily_oee_summary_new: {
        Args: { target_date: string; target_rates: Json }
        Returns: undefined
      }
      delete_pallets_by_numbers: {
        Args: { pallet_numbers: string[] }
        Returns: {
          deleted_pallet_id: string
          deleted_pallet_number: string
          had_assignments: number
        }[]
      }
      delete_printed_labels_by_date: {
        Args: { target_date: string }
        Returns: {
          deleted_count: number
          deleted_ids: string[]
        }[]
      }
      delete_test_labels_by_date: {
        Args: { target_date: string }
        Returns: {
          deleted_assignments: number
          deleted_labels: number
        }[]
      }
      fix_missing_hours: {
        Args: never
        Returns: {
          activity_type: string
          corrected: boolean
          estimated_hours: number
          original_hours: number
          record_id: string
          units_produced: number
        }[]
      }
      generate_next_box_number: { Args: never; Returns: string }
      generate_next_pallet_number: { Args: never; Returns: string }
      generate_weekly_production_report: {
        Args: { week_start_date: string }
        Returns: Json
      }
      get_data_quality_metrics: {
        Args: never
        Returns: {
          activities_corrected: Json
          correction_percentage: number
          records_with_corrections: number
          total_records: number
        }[]
      }
      get_stock_levels: {
        Args: never
        Returns: {
          current_stock: number
          material_code: string
          material_id: string
          material_name: string
          total_dispatched: number
          total_received: number
        }[]
      }
      populate_oee_summaries: {
        Args: { end_date: string; start_date: string; target_rates: Json }
        Returns: undefined
      }
      update_po_progress: {
        Args: { input_po_number: string }
        Returns: undefined
      }
      update_timesheet_tracking: { Args: never; Returns: undefined }
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
