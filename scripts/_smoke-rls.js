// 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
// 冒烟测试行级安全用例：学生数据隔离、教师只读与管理员全域读取。
import crypto from "node:crypto";
import { assert, test } from "./_smoke-helpers.js";

function sampleScores() {
  const raw = {
    SOLID: 7,
    PERSIST: 6,
    VALUE: 8,
    COLLAB: 7,
    EXPLORE: 6,
    RESOURCE: 5,
    GROW: 8,
    GUIDE: 6,
  };
  return { raw, lvls: {}, matchInfo: {} };
}

export async function runRlsTests(admin, contexts) {
  const { studentA, studentB, teacher } = contexts;

  await test("学生可以写入自己的测评与学习行为", async function () {
    const assessment = await studentA.client
      .from("assessment_results")
      .insert({
        user_id: studentA.userId,
        scores: sampleScores(),
        profile_type: "SOLID",
      })
      .select("id")
      .single();
    assert(!assessment.error, assessment.error?.message);
    contexts.assessmentA = assessment.data.id;

    const activity = await studentA.client
      .from("activity_records")
      .insert({ user_id: studentA.userId, event_type: "case_study", reference_id: "beidou" })
      .select("id")
      .single();
    assert(!activity.error, activity.error?.message);
  });

  await test("测试学生乙写入自己的测评与学习行为", async function () {
    const assessment = await studentB.client
      .from("assessment_results")
      .insert({
        user_id: studentB.userId,
        scores: sampleScores(),
        profile_type: "GROW",
      })
      .select("id")
      .single();
    assert(!assessment.error, assessment.error?.message);
    contexts.assessmentB = assessment.data.id;

    const activity = await studentB.client
      .from("activity_records")
      .insert({ user_id: studentB.userId, event_type: "daily_question", reference_id: "q1" })
      .select("id")
      .single();
    assert(!activity.error, activity.error?.message);
  });

  await test("学生只能读自己的资料", async function () {
    const { data, error } = await studentA.client.from("profiles").select("id, login_id");
    assert(!error, error?.message);
    assert(data.length === 1 && data[0].id === studentA.userId, "读到了他人资料");
  });

  await test("学生不能通过查询条件读取他人测评", async function () {
    const { data, error } = await studentA.client
      .from("assessment_results")
      .select("id, user_id")
      .eq("user_id", studentB.userId);
    assert(!error, error?.message);
    assert(data.length === 0, "读到了他人测评");
  });

  await test("学生查询全部测评时只能返回自己的记录", async function () {
    const { data, error } = await studentA.client.from("assessment_results").select("id, user_id");
    assert(!error, error?.message);
    assert(data.length > 0, "没有读到自己的测评");
    assert(
      data.every(function (row) {
        return row.user_id === studentA.userId;
      }),
      "结果中包含他人记录"
    );
  });

  await test("学生不能通过查询条件读取他人学习行为", async function () {
    const { data, error } = await studentA.client
      .from("activity_records")
      .select("id, user_id")
      .eq("user_id", studentB.userId);
    assert(!error, error?.message);
    assert(data.length === 0, "读到了他人学习行为");
  });

  await test("学生不能修改或删除自己的测评", async function () {
    const updated = await studentA.client
      .from("assessment_results")
      .update({ profile_type: "GAME" })
      .eq("id", contexts.assessmentA)
      .select("id");
    assert(!updated.error || updated.error.code === "42501", updated.error?.message);
    assert((updated.data || []).length === 0, "测评被修改");

    const deleted = await studentA.client
      .from("assessment_results")
      .delete()
      .eq("id", contexts.assessmentA)
      .select("id");
    assert(!deleted.error || deleted.error.code === "42501", deleted.error?.message);
    assert((deleted.data || []).length === 0, "测评被删除");

    const check = await admin.from("assessment_results").select("profile_type").eq("id", contexts.assessmentA).single();
    assert(check.data.profile_type === "SOLID", "数据库中的测评类型已变化");
  });

  await test("学生不能修改或删除他人测评", async function () {
    const updated = await studentA.client
      .from("assessment_results")
      .update({ profile_type: "GAME" })
      .eq("id", contexts.assessmentB)
      .select("id");
    assert(!updated.error || updated.error.code === "42501", updated.error?.message);
    assert((updated.data || []).length === 0, "他人测评被修改");

    const deleted = await studentA.client
      .from("assessment_results")
      .delete()
      .eq("id", contexts.assessmentB)
      .select("id");
    assert(!deleted.error || deleted.error.code === "42501", deleted.error?.message);
    assert((deleted.data || []).length === 0, "他人测评被删除");
  });

  await test("学生不能写入或修改 profiles", async function () {
    const inserted = await studentA.client.from("profiles").insert({
      id: crypto.randomUUID(),
      login_id: `hack${Date.now()}`,
      name: "非法账号",
      role: "admin",
    });
    assert(Boolean(inserted.error), "学生成功插入了资料");

    const updated = await studentA.client
      .from("profiles")
      .update({ name: "被篡改" })
      .eq("id", studentA.userId)
      .select("id");
    assert(!updated.error || updated.error.code === "42501", updated.error?.message);
    assert((updated.data || []).length === 0, "学生成功修改了资料");
    const check = await admin.from("profiles").select("name").eq("id", studentA.userId).single();
    assert(check.data.name === "冒烟学生甲", "资料姓名已变化");
  });

  await test("学生不能伪造 AI 行为记录或替他人写入行为", async function () {
    const aiRecord = await studentA.client.from("activity_records").insert({
      user_id: studentA.userId,
      event_type: "ai_deepseek",
      success: true,
    });
    assert(Boolean(aiRecord.error), "学生成功伪造 AI 调用记录");

    const others = await studentA.client.from("activity_records").insert({
      user_id: studentB.userId,
      event_type: "case_study",
      reference_id: "beidou",
    });
    assert(Boolean(others.error), "学生成功替他人写入行为记录");
  });

  await test("教师可以读取全部资料、测评与行为", async function () {
    const profiles = await teacher.client.from("profiles").select("id");
    assert(!profiles.error, profiles.error?.message);
    assert(profiles.data.length >= 4, "教师读到的账号数量不足");

    const assessments = await teacher.client
      .from("assessment_results")
      .select("id, user_id")
      .eq("user_id", studentB.userId);
    assert(!assessments.error, assessments.error?.message);
    assert(assessments.data.length === 1, "教师未能读到学生测评");

    const activities = await teacher.client.from("activity_records").select("id").eq("user_id", studentB.userId);
    assert(!activities.error, activities.error?.message);
    assert(activities.data.length >= 1, "教师未能读到学生行为");
  });

  await test("教师不能写入资料、测评或行为", async function () {
    const profile = await teacher.client.from("profiles").insert({
      id: crypto.randomUUID(),
      login_id: `hackt${Date.now()}`,
      name: "非法教师",
      role: "teacher",
    });
    assert(Boolean(profile.error), "教师成功写入资料");

    const assessment = await teacher.client.from("assessment_results").insert({
      user_id: teacher.userId,
      scores: sampleScores(),
      profile_type: "SOLID",
    });
    assert(Boolean(assessment.error), "教师成功写入测评");

    const activity = await teacher.client.from("activity_records").insert({
      user_id: teacher.userId,
      event_type: "case_study",
    });
    assert(Boolean(activity.error), "教师成功写入行为");

    const updated = await teacher.client
      .from("assessment_results")
      .update({ profile_type: "GAME" })
      .eq("id", contexts.assessmentB)
      .select("id");
    assert(!updated.error || updated.error.code === "42501", updated.error?.message);
    assert((updated.data || []).length === 0, "教师成功修改测评");
  });

  await test("管理员可以读取全部业务数据", async function () {
    const profiles = await contexts.adminClient.from("profiles").select("id");
    assert(!profiles.error, profiles.error?.message);
    assert(profiles.data.length >= 4, "管理员读到的账号数量不足");

    const assessments = await contexts.adminClient
      .from("assessment_results")
      .select("id, user_id")
      .in("user_id", [studentA.userId, studentB.userId]);
    assert(!assessments.error, assessments.error?.message);
    assert(assessments.data.length >= 2, "管理员未能读到全部测评");
  });
}
