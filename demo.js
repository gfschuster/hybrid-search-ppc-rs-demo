"use strict";
const element=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;};
const answer=document.getElementById("answer");
function render(example){
  answer.replaceChildren(element("h3",example.question,"results-heading"));answer.hidden=false;
  const brief=element("div",undefined,"answer-summary");
  for(const claim of example.claims)brief.append(element("p",claim.text));
  brief.append(element("p",`Resumo extrativo selecionado por ${example.model}, na execução local registrada.` ,"muted"));
  const details=element("details",undefined,"source-disclosure");details.append(element("summary",`Ver fontes (${example.claims.length})`));
  for(const claim of example.claims){
    const card=element("article",undefined,"evidence-card");
    card.append(element("h3",claim.evidence_id),element("p",claim.locator,"muted"),element("blockquote",claim.quote));
    const source=element("a","Abrir fonte institucional ↗","text-link");
    const url=new URL(claim.url);
    if(url.protocol!=="https:" || !(url.hostname==="furg.br" || url.hostname.endsWith(".furg.br")))throw new Error("Origem inválida");
    source.href=url.href;source.target="_blank";source.rel="noopener noreferrer";
    card.append(source);details.append(card);
  }
  answer.append(brief,details);
}
fetch("./demo.json").then(r=>{if(!r.ok)throw new Error("Exemplos indisponíveis");return r.json();}).then(data=>{
  if(data.mode!=="precomputed_public_demo" || data.live_search!==false)throw new Error("Modo inválido");
  document.getElementById("demo-status").textContent=`Consultas registradas em ${data.date.split("-").reverse().join("/")}. Esta demonstração não executa consultas novas.`;
  for(const example of data.examples){const button=element("button",example.question,"secondary-button");button.type="button";button.addEventListener("click",()=>render(example));document.getElementById("examples").append(button);}
  render(data.examples[0]);
}).catch(error=>{document.getElementById("demo-status").textContent=error.message;});
