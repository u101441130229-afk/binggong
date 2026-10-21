// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// Supabase 数据查询收口：统一分页读取，避免单次 1000 行上限漏数据。

import { supabase } from "./supabaseClient.js";

export async function fetchAllRows(buildQuery, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

export function fetchStudentProfiles() {
  return fetchAllRows(function () {
    return supabase
      .from("profiles")
      .select("id,login_id,name,role,class_code,major,group_name,is_active,created_at")
      .eq("role", "student")
      .eq("is_active", true)
      .order("login_id", { ascending: true });
  });
}

export function fetchAssessmentResults() {
  return fetchAllRows(function () {
    return supabase
      .from("assessment_results")
      .select("id,user_id,scores,profile_type,created_at")
      .order("created_at", { ascending: true });
  });
}

export function fetchActivityRecords() {
  return fetchAllRows(function () {
    return supabase
      .from("activity_records")
      .select("id,user_id,event_type,reference_id,success,created_at")
      .order("created_at", { ascending: true });
  });
}

export async function fetchTeacherSnapshot() {
  const [students, assessments, activities] = await Promise.all([
    fetchStudentProfiles(),
    fetchAssessmentResults(),
    fetchActivityRecords(),
  ]);
  return { students, assessments, activities };
}

export const fetchSchoolSnapshot = fetchTeacherSnapshot;
