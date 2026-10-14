import { test } from "node:test";
import assert from "node:assert/strict";
import { QUESTS } from "../src/adventure/content.js";
import { questQuestion, QUEST_EFFECTS, drawQuestEffects } from "../src/adventure/quest-tasks.js";
import { fresh, restore, finishQuest } from "../src/adventure/progress.js";
import { createBattle, answerBattle, advanceBattle } from "../src/adventure/battle-session.js";
import { seeded } from "../src/adventure/questions.js";
import { questSceneMarkup } from "../src/adventure/quest-ui.js";

test("every quest generates contextual quantities with independently checked answers", () => {
  for (const quest of QUESTS) for (const level of [1,2,3]) for (let i=0;i<100;i++) {
    const q=questQuestion(quest.id,i%quest.count,level,seeded(i+10));
    const nums=q.text.match(/\d+(?:\.\d+)?/g).map(Number);
    const kind=quest.id==="king"?["welcome","bakery","garden","library","market","bridge","fungi","camp"][i%quest.count]:quest.id;
    let expected;
    if(kind==="welcome") expected=i%quest.count%3===1?nums[0]-nums[1]:nums[0]+nums[1];
    if(kind==="bakery") expected=nums[0]*nums[1];
    if(kind==="garden"||kind==="fungi") expected=nums[0]/nums[1];
    if(kind==="library") expected=Math.round((nums[0]+nums[1])*10)/10;
    if(kind==="market") expected=nums[0]*(100-nums[1])/100;
    if(kind==="bridge") expected=nums[0]+nums[1]*nums[2];
    if(kind==="camp") expected=nums[0]*nums[1]-nums[2];
    assert.equal(q.answer,expected,q.text);
    assert.ok(q.hint && q.success && q.scene && QUEST_EFFECTS[quest.id]);
    assert.match(questSceneMarkup(q),/task-scene/);
  }
});

test("wrong quest answers never advance work; completed task checkpoints resume after reload", () => {
  const state=fresh(),quest=QUESTS[0];
  const battle=createBattle({mode:"quest",quest,skill:quest.skill,count:quest.count},1,1000,()=>.3);
  answerBattle(battle,String(battle.q.answer+1));
  advanceBattle(battle,1);
  assert.equal(battle.index,0);
  answerBattle(battle,String(battle.q.answer));
  advanceBattle(battle,1);
  state.questWork.welcome=battle.index;
  const loaded=restore(JSON.parse(JSON.stringify(state)));
  const resumed=createBattle({mode:"quest",quest,count:quest.count,progress:loaded.questWork.welcome},1);
  assert.equal(resumed.index,1);
  assert.equal(loaded.completed.length,0);
  assert.equal(loaded.coins,0);
  assert.equal(finishQuest(loaded,"welcome"),true);
  assert.equal(finishQuest(loaded,"welcome"),false);
  assert.equal(loaded.questWork.welcome,undefined);
});

test("old saves derive quest world effects; invalid checkpoints cannot skip tasks", () => {
  const old=restore({version:1,completed:["welcome","bakery","garden"],coins:65});
  let labels=[];
  drawQuestEffects({state:old,rect:()=>{},label:text=>labels.push(text)});
  assert.ok(labels.includes("ORDER READY") && labels.includes("BEDS WATERED"));
  const again=restore(JSON.parse(JSON.stringify(old)));
  labels=[];
  drawQuestEffects({state:again,rect:()=>{},label:text=>labels.push(text)});
  assert.equal(labels.length,2);
  assert.equal(again.coins,65);
  const bad=restore({version:1,questWork:{welcome:999,bakery:-1,garden:"4"}});
  assert.deepEqual(bad.questWork,{});
});

test("all contextual quests finish with original rewards and reject repeated submissions", () => {
  let state=fresh();
  for (const quest of QUESTS) {
    const b=createBattle({mode:"quest",quest,skill:quest.skill,count:quest.count},2,1000,seeded(50));
    let ended=false;
    for(let i=0;i<quest.count;i++){
      assert.equal(answerBattle(b,String(b.q.answer)).status,"correct");
      const score=b.score;
      assert.equal(answerBattle(b,String(b.q.answer)).status,"already-answered");
      assert.equal(b.score,score);
      ended=advanceBattle(b,2).finished;
      assert.equal(ended,i===quest.count-1);
    }
    assert.ok(ended);
    assert.equal(finishQuest(state,quest.id),true);
    assert.equal(finishQuest(state,quest.id),false);
    state=restore(JSON.parse(JSON.stringify(state)));
  }
  assert.equal(state.completed.length,9);
  assert.equal(state.coins,340);
  assert.equal(state.xp,490);
});
