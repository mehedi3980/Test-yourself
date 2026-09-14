const PAGE_SIZE=10, EXAM_MINUTES=20;
let questions=[], answers=[], page=0, timerId=null, secondsLeft=EXAM_MINUTES*60, submitted=false;

const $=id=>document.getElementById(id);
function shuffle(a){return [...a].sort(()=>Math.random()-.5)}
function formatTime(s){return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}
function loadExam(){
  questions=shuffle(QUESTIONS); answers=Array(questions.length).fill(null);
  $("examTitle").textContent="English Random Practice Test";
  $("examMeta").textContent=`${questions.length} MCQs • ${EXAM_MINUTES} minutes • ${PAGE_SIZE} questions per page`;
}
function render(){
  const start=page*PAGE_SIZE,end=Math.min(start+PAGE_SIZE,questions.length);
  $("questions").innerHTML=questions.slice(start,end).map((q,i)=>{
    const idx=start+i, chosen=answers[idx];
    return `<article class="question-card">
      <div class="question-number">QUESTION ${idx+1}</div><h3>${escapeHtml(q.question)}</h3>
      ${q.options.map((op,j)=>`<label class="option ${chosen===j?"selected locked":""}">
        <input type="radio" name="q${idx}" value="${j}" ${chosen===j?"checked":""} ${chosen!==null?"disabled":""}>
        <b>${String.fromCharCode(65+j)}.</b> ${escapeHtml(op)}
      </label>`).join("")}
    </article>`
  }).join("");
  $("progressText").textContent=`Questions ${start+1}–${end} of ${questions.length}`;
  $("progressBar").style.width=`${end/questions.length*100}%`;
  $("prevBtn").classList.toggle("hidden",page===0);
  $("nextBtn").classList.toggle("hidden",end===questions.length);
  $("submitBtn").classList.toggle("hidden",end!==questions.length);
  renderGrid();
  document.querySelectorAll('input[type=radio]').forEach(el=>el.addEventListener("change",e=>{
    const idx=Number(e.target.name.slice(1));
    if(answers[idx]!==null)return;
    answers[idx]=Number(e.target.value);
    render();
  }));
}
function renderGrid(){
  const start=page*PAGE_SIZE;
  $("questionGrid").innerHTML=questions.map((_,i)=>`<button class="qdot ${i>=start&&i<start+PAGE_SIZE?"active":""} ${answers[i]!==null?"done":""}" onclick="jump(${Math.floor(i/PAGE_SIZE)})">${i+1}</button>`).join("");
}
window.jump=p=>{page=p;render();window.scrollTo({top:$("examArea").offsetTop-80,behavior:"smooth"})};
function start(){
  loadExam(); page=0; submitted=false; secondsLeft=EXAM_MINUTES*60;
  $("home").classList.add("hidden");$("examArea").classList.remove("hidden");$("result").classList.add("hidden");$("review").classList.add("hidden");
  $("startBtn").classList.add("hidden");$("timer").textContent=formatTime(secondsLeft);render();
  clearInterval(timerId);timerId=setInterval(()=>{secondsLeft--; $("timer").textContent=formatTime(secondsLeft); if(secondsLeft<=0){clearInterval(timerId);submit(true)}},1000);
}
function submit(auto=false){
  if(submitted)return;
  if(!auto && !confirm("Submit your exam now?"))return;
  submitted=true;clearInterval(timerId);
  const correct=answers.reduce((n,a,i)=>n+(a===questions[i].answer?1:0),0);
  const skipped=answers.filter(a=>a===null).length, wrong=questions.length-correct-skipped;
  const pct=Math.round(correct/questions.length*100);
  $("examArea").classList.add("hidden");$("result").classList.remove("hidden");
  $("score").textContent=`${pct}%`; $("resultText").textContent=`Correct: ${correct} • Wrong: ${wrong} • Skipped: ${skipped}`;
}
function review(){
  $("review").classList.remove("hidden");
  $("reviewList").innerHTML=questions.map((q,i)=>{
    const a=answers[i], ok=a===q.answer;
    return `<div class="review-item ${ok?"correct":"wrong"}"><b>${i+1}. ${escapeHtml(q.question)}</b><p>Your answer: ${a===null?"Skipped":escapeHtml(q.options[a])}</p><p>Correct answer: <strong>${escapeHtml(q.options[q.answer])}</strong></p></div>`
  }).join("");
  window.scrollTo({top:$("review").offsetTop-70,behavior:"smooth"});
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
$("startBtn").onclick=start;$("nextBtn").onclick=()=>{page++;render();window.scrollTo({top:$("examArea").offsetTop-80,behavior:"smooth"})};
$("prevBtn").onclick=()=>{page--;render();window.scrollTo({top:$("examArea").offsetTop-80,behavior:"smooth"})};
$("submitBtn").onclick=()=>submit(false);$("reviewBtn").onclick=review;$("restartBtn").onclick=start;
$("themeBtn").onclick=()=>document.body.classList.toggle("dark");
