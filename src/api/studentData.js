// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 学生个人测评与学习行为记录读写，所有查询受行级安全策略约束。

import { supabase } from "./supabaseClient.js";
import { fetchAllRows } from "./dataAccess.js";

export function fetchMyAssessments(userId) {
  return fetchAllRows(function () {
    return supabase
      .from("assessment_results")
      .select("id,user_id,scores,profile_type,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  });
}

export function fetchMyActivities(userId) {
  return fetchAllRows(function () {
    return supabase
      .from("activity_records")
      .select("id,user_id,event_type,reference_id,success,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  });
}

export async function saveAssessment(userId, raw, lvls, profileType, matchInfo) {
  const { data, error } = await supabase
    .from("assessment_results")
    .insert({
      user_id: userId,
      scores: { raw, lvls, matchInfo },
      profile_type: profileType,
    })
    .select("id,user_id,scores,profile_type,created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function recordActivity(userId, eventType, referenceId) {
  const { data, error } = await supabase
    .from("activity_records")
    .insert({
      user_id: userId,
      event_type: eventType,
      reference_id: referenceId || null,
      success: true,
    })
    .select("id,user_id,event_type,reference_id,success,created_at")
    .single();
  if (error) throw error;
  return data;
}
