export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      courts: {
        Row: {
          address: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          address?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          address?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          created_at: string;
          default_court_id: string | null;
          deleted_at: string | null;
          female_cap: number;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          default_court_id?: string | null;
          deleted_at?: string | null;
          female_cap?: number;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          default_court_id?: string | null;
          deleted_at?: string | null;
          female_cap?: number;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'groups_default_court_id_fkey';
            columns: ['default_court_id'];
            isOneToOne: false;
            referencedRelation: 'courts';
            referencedColumns: ['id'];
          },
        ];
      };
      members: {
        Row: {
          gender: string;
          group_id: string;
          id: string;
          name: string;
          position: number;
          role: string | null;
        };
        Insert: {
          gender: string;
          group_id: string;
          id?: string;
          name: string;
          position?: number;
          role?: string | null;
        };
        Update: {
          gender?: string;
          group_id?: string;
          id?: string;
          name?: string;
          position?: number;
          role?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'members_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
        ];
      };
      session_players: {
        Row: {
          base_share: number;
          court_and_shuttle_share: number;
          drinks_water: boolean;
          gender: string;
          guest_source: string | null;
          name: string;
          paid_at: string | null;
          paid_method: string | null;
          player_id: string;
          position: number;
          raw_net_payable: number;
          role: string | null;
          rounded_payable: number;
          session_id: string;
          type: string;
          water_credit: number;
          water_share: number;
        };
        Insert: {
          base_share?: number;
          court_and_shuttle_share?: number;
          drinks_water?: boolean;
          gender: string;
          guest_source?: string | null;
          name: string;
          paid_at?: string | null;
          paid_method?: string | null;
          player_id: string;
          position?: number;
          raw_net_payable?: number;
          role?: string | null;
          rounded_payable?: number;
          session_id: string;
          type?: string;
          water_credit?: number;
          water_share?: number;
        };
        Update: {
          base_share?: number;
          court_and_shuttle_share?: number;
          drinks_water?: boolean;
          gender?: string;
          guest_source?: string | null;
          name?: string;
          paid_at?: string | null;
          paid_method?: string | null;
          player_id?: string;
          position?: number;
          raw_net_payable?: number;
          role?: string | null;
          rounded_payable?: number;
          session_id?: string;
          type?: string;
          water_credit?: number;
          water_share?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'session_players_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      sessions: {
        Row: {
          court_fee: number;
          court_id: string | null;
          court_name: string;
          created_at: string;
          female_cap: number;
          group_id: string | null;
          group_name: string;
          hours_played: number;
          id: string;
          iso_date: string;
          rounded_female_unit: number;
          rounded_male_unit: number;
          shuttle_brand: string;
          shuttle_total_cost: number;
          shuttlecock_id: string | null;
          shuttles_used: number;
          total_cost: number;
          tube_price: number;
          water_drinkers_count: number;
          water_fee: number;
          water_payer_id: string | null;
          water_per_person: number;
        };
        Insert: {
          court_fee?: number;
          court_id?: string | null;
          court_name?: string;
          created_at?: string;
          female_cap?: number;
          group_id?: string | null;
          group_name?: string;
          hours_played?: number;
          id?: string;
          iso_date: string;
          rounded_female_unit?: number;
          rounded_male_unit?: number;
          shuttle_brand?: string;
          shuttle_total_cost?: number;
          shuttlecock_id?: string | null;
          shuttles_used?: number;
          total_cost?: number;
          tube_price?: number;
          water_drinkers_count?: number;
          water_fee?: number;
          water_payer_id?: string | null;
          water_per_person?: number;
        };
        Update: {
          court_fee?: number;
          court_id?: string | null;
          court_name?: string;
          created_at?: string;
          female_cap?: number;
          group_id?: string | null;
          group_name?: string;
          hours_played?: number;
          id?: string;
          iso_date?: string;
          rounded_female_unit?: number;
          rounded_male_unit?: number;
          shuttle_brand?: string;
          shuttle_total_cost?: number;
          shuttlecock_id?: string | null;
          shuttles_used?: number;
          total_cost?: number;
          tube_price?: number;
          water_drinkers_count?: number;
          water_fee?: number;
          water_payer_id?: string | null;
          water_per_person?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'sessions_court_id_fkey';
            columns: ['court_id'];
            isOneToOne: false;
            referencedRelation: 'courts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sessions_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sessions_shuttlecock_id_fkey';
            columns: ['shuttlecock_id'];
            isOneToOne: false;
            referencedRelation: 'shuttlecocks';
            referencedColumns: ['id'];
          },
        ];
      };
      shuttlecocks: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          is_default: boolean;
          name: string;
          tube_price: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_default?: boolean;
          name: string;
          tube_price: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_default?: boolean;
          name?: string;
          tube_price?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      save_group: {
        Args: { p_group: Json; p_members: Json };
        Returns: undefined;
      };
      save_session: {
        Args: { p_players: Json; p_session: Json };
        Returns: string;
      };
      set_default_shuttlecock: { Args: { p_id: string }; Returns: undefined };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
