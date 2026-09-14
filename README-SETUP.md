# EduTest — Final Secure Multi-Admin Setup

এই ZIP-টি GitHub Pages + Supabase-এর জন্য তৈরি।

## 1. Supabase project
একটি Supabase project তৈরি করো।

## 2. Database
Supabase → SQL Editor → `supabase-schema.sql` পুরোটা Run করো।

## 3. Public config
Supabase → Project Settings → API থেকে:
- Project URL
- anon/publishable key

`supabase-config.js`-এ বসাও।

⚠️ Service Role Key কখনো GitHub-এ বা `supabase-config.js`-এ দেবে না।

## 4. প্রথম Master Admin
Supabase → Authentication → Users → Add user.
একটি email/password দিয়ে প্রথম user তৈরি করো এবং email confirm করে দাও।

তারপর তার UUID কপি করে SQL Editor-এ:

insert into public.profiles(id,username,role)
values('তোমার_AUTH_USER_UUID','masteradmin','master');

## 5. Master Admin backend function
`functions/manage-admin/index.ts` Supabase Edge Function হিসেবে deploy করতে হবে।

Dashboard থেকে function তৈরি করে এই code ব্যবহার করো।
Function-এর server-side secrets:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

Supabase CLI ব্যবহার করলে:
supabase functions deploy manage-admin

Service-role key শুধু Edge Function-এর secret হিসেবে থাকবে।

## 6. GitHub Pages
এই ZIP-এর সব frontend file repository-তে upload করো।
GitHub Pages চালু করো।

## 7. Login
`login.html`-এ username + password দিয়ে login করা যাবে।

Master Admin:
- সব Admin দেখতে পারবে
- নতুন Admin বানাতে পারবে
- Admin disable/enable করতে পারবে
- সব exam দেখতে পারবে

Normal Admin:
- শুধু নিজের exam/question manage করতে পারবে
- অন্য Admin-এর data RLS-এর কারণে দেখতে বা edit করতে পারবে না

## 8. নতুন প্রশ্ন
Admin Dashboard → New Exam/Edit → Add Question → Save Questions.

প্রশ্নগুলো database-এ থাকবে, তাই নতুন প্রশ্ন যোগ করতে GitHub code edit করা লাগবে না।

## 9. গুরুত্বপূর্ণ security note
এই starter-এ public browser প্রশ্নের `correct_index` দেখতে পারে, কারণ instant client-side result-এর জন্য answer browser-এ যায়।

স্কুল/বাণিজ্যিক/high-stakes exam হলে answer checking Edge Function-এ সরিয়ে নিতে হবে। তখন public client correct answers পাবে না।

## 10. Existing 30-question demo
`questions.js`-এ 30টি English MCQ রাখা আছে, যাতে GitHub Pages-এ backend ছাড়াও demo exam দেখা যায়।

