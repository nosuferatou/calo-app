// Generated from the local Supabase schema with `npx supabase gen types typescript --local --schema public`.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "account_preferences": {
                  Row: {
                    "catalog_view_mode": string | null,"created_at": string,"language": string,"theme": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "catalog_view_mode"?: string | null,"created_at"?: string,"language": string,"theme": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "catalog_view_mode"?: string | null,"created_at"?: string,"language"?: string,"theme"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"custom_foods": {
                  Row: {
                    "calories": number,"carbohydrates": number,"category": string,"created_at": string,"default_grams": number,"fat": number,"fiber": number,"id": string,"name": string,"protein": number,"saturated_fat": number,"sodium": number,"source": string,"sugar": number,"synonyms": (string)[],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "calories": number,"carbohydrates": number,"category": string,"created_at"?: string,"default_grams": number,"fat": number,"fiber": number,"id": string,"name": string,"protein": number,"saturated_fat": number,"sodium": number,"source": string,"sugar": number,"synonyms"?: (string)[],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "calories"?: number,"carbohydrates"?: number,"category"?: string,"created_at"?: string,"default_grams"?: number,"fat"?: number,"fiber"?: number,"id"?: string,"name"?: string,"protein"?: number,"saturated_fat"?: number,"sodium"?: number,"source"?: string,"sugar"?: number,"synonyms"?: (string)[],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"favorite_foods": {
                  Row: {
                    "catalog_food_id": string | null,"created_at": string,"custom_food_id": string | null,"id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "catalog_food_id"?: string | null,"created_at"?: string,"custom_food_id"?: string | null,"id": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "catalog_food_id"?: string | null,"created_at"?: string,"custom_food_id"?: string | null,"id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "favorite_foods_custom_food_owner_fk"
      columns: ["user_id","custom_food_id"]
isOneToOne: false
      referencedRelation: "custom_foods"
      referencedColumns: ["user_id","id"]
    }
                  ]
                },"food_entries": {
                  Row: {
                    "calories": number,"carbohydrates": number,"created_at": string,"fat": number,"fiber": number | null,"food_id": string,"grams": number,"id": string,"log_date": string,"logged_at": string,"meal_category": string,"name": string,"protein": number,"saturated_fat": number | null,"serving_label": string | null,"session_id": string | null,"sodium": number | null,"sugar": number | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "calories": number,"carbohydrates": number,"created_at"?: string,"fat": number,"fiber"?: number | null,"food_id": string,"grams": number,"id": string,"log_date": string,"logged_at": string,"meal_category": string,"name": string,"protein": number,"saturated_fat"?: number | null,"serving_label"?: string | null,"session_id"?: string | null,"sodium"?: number | null,"sugar"?: number | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "calories"?: number,"carbohydrates"?: number,"created_at"?: string,"fat"?: number,"fiber"?: number | null,"food_id"?: string,"grams"?: number,"id"?: string,"log_date"?: string,"logged_at"?: string,"meal_category"?: string,"name"?: string,"protein"?: number,"saturated_fat"?: number | null,"serving_label"?: string | null,"session_id"?: string | null,"sodium"?: number | null,"sugar"?: number | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "food_entries_session_owner_fk"
      columns: ["user_id","log_date","meal_category","session_id"]
isOneToOne: false
      referencedRelation: "meal_sessions"
      referencedColumns: ["user_id","log_date","meal_category","id"]
    }
                  ]
                },"meal_cart_drafts": {
                  Row: {
                    "created_at": string,"id": string,"items": NonNullable<Json>,"log_date": string,"meal_category": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string,"items"?: NonNullable<Json>,"log_date": string,"meal_category": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"items"?: NonNullable<Json>,"log_date"?: string,"meal_category"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"meal_sessions": {
                  Row: {
                    "created_at": string,"id": string,"log_date": string,"meal_category": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string,"log_date": string,"meal_category": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"log_date"?: string,"meal_category"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"nutrition_targets": {
                  Row: {
                    "activity_pal": number | null,"actual_deficit_kcal": number | null,"bmr": number | null,"calculated_at": string | null,"calorie_guardrail_kcal": number | null,"calories": number,"carbohydrates": number,"created_at": string,"fat": number,"formula_version": number | null,"protein": number,"requested_deficit_kcal": number | null,"source": string | null,"tdee": number | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activity_pal"?: number | null,"actual_deficit_kcal"?: number | null,"bmr"?: number | null,"calculated_at"?: string | null,"calorie_guardrail_kcal"?: number | null,"calories": number,"carbohydrates": number,"created_at"?: string,"fat": number,"formula_version"?: number | null,"protein": number,"requested_deficit_kcal"?: number | null,"source"?: string | null,"tdee"?: number | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "activity_pal"?: number | null,"actual_deficit_kcal"?: number | null,"bmr"?: number | null,"calculated_at"?: string | null,"calorie_guardrail_kcal"?: number | null,"calories"?: number,"carbohydrates"?: number,"created_at"?: string,"fat"?: number,"formula_version"?: number | null,"protein"?: number,"requested_deficit_kcal"?: number | null,"source"?: string | null,"tdee"?: number | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "activity_level": string | null,"age_years": number | null,"biological_sex": string | null,"created_at": string,"current_weight_kg": number | null,"custom_carb_percent": number | null,"custom_fat_percent": number | null,"custom_protein_percent": number | null,"desired_rate_kg_per_week": number | null,"display_name": string | null,"fitness_goal": string | null,"height_cm": number | null,"macro_preference": string | null,"target_weight_kg": number | null,"updated_at": string,"user_id": string,"workout_days_per_week": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "activity_level"?: string | null,"age_years"?: number | null,"biological_sex"?: string | null,"created_at"?: string,"current_weight_kg"?: number | null,"custom_carb_percent"?: number | null,"custom_fat_percent"?: number | null,"custom_protein_percent"?: number | null,"desired_rate_kg_per_week"?: number | null,"display_name"?: string | null,"fitness_goal"?: string | null,"height_cm"?: number | null,"macro_preference"?: string | null,"target_weight_kg"?: number | null,"updated_at"?: string,"user_id": string,"workout_days_per_week"?: number | null
                  }
                  Update: {
                    "activity_level"?: string | null,"age_years"?: number | null,"biological_sex"?: string | null,"created_at"?: string,"current_weight_kg"?: number | null,"custom_carb_percent"?: number | null,"custom_fat_percent"?: number | null,"custom_protein_percent"?: number | null,"desired_rate_kg_per_week"?: number | null,"display_name"?: string | null,"fitness_goal"?: string | null,"height_cm"?: number | null,"macro_preference"?: string | null,"target_weight_kg"?: number | null,"updated_at"?: string,"user_id"?: string,"workout_days_per_week"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"saved_meal_items": {
                  Row: {
                    "created_at": string,"food_snapshot": NonNullable<Json>,"grams": number,"position": number,"saved_meal_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"food_snapshot": NonNullable<Json>,"grams": number,"position": number,"saved_meal_id": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"food_snapshot"?: NonNullable<Json>,"grams"?: number,"position"?: number,"saved_meal_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "saved_meal_items_meal_owner_fk"
      columns: ["user_id","saved_meal_id"]
isOneToOne: false
      referencedRelation: "saved_meals"
      referencedColumns: ["user_id","id"]
    }
                  ]
                },"saved_meals": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string,"name": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"search_history": {
                  Row: {
                    "created_at": string,"queries": (string)[],"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"queries"?: (string)[],"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"queries"?: (string)[],"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"weight_records": {
                  Row: {
                    "created_at": string,"id": string,"logged_at": string,"updated_at": string,"user_id": string,"weight_kg": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id": string,"logged_at": string,"updated_at"?: string,"user_id": string,"weight_kg": number
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"logged_at"?: string,"updated_at"?: string,"user_id"?: string,"weight_kg"?: number
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            [_ in never]: never
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
