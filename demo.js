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
  for(const example of data.examples){const button=element("button",example.question,"secondary-button");button.type="button";button.addEventListener("click",()=>render(example));document.getElementById("example-buttons").append(button);}
  render(data.examples[0]);
}).catch(error=>{document.getElementById("demo-status").textContent=error.message;});

const catalogForm = document.getElementById("catalog-form");
const catalogQuery = document.getElementById("catalog-query");
const catalogInstitution = document.getElementById("catalog-institution");
const catalogResults = document.getElementById("catalog-results");
const catalogStatus = document.getElementById("catalog-status");
const catalogMore = document.getElementById("catalog-more");
const fold = value => String(value ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("pt-BR");
const institutionHosts = new Set([
  "ufsm.br", "unipampa.edu.br", "ufpel.edu.br", "furg.br",
  "uffs.edu.br", "iffarroupilha.edu.br", "ifrs.edu.br", "ifsul.edu.br"
]);

function catalogItem(source) {
  const row = element("li");
  const title = element("a", source.title, "text-link");
  const url = new URL(source.url);
  const host = [...institutionHosts].some(domain => url.hostname === domain || url.hostname.endsWith("." + domain));
  if (url.protocol !== "https:" || !host || url.username || url.password) throw new Error("Origem institucional inválida");
  title.href = url.href;
  title.target = "_blank";
  title.rel = "noopener noreferrer";
  row.append(title);
  const date = source.curriculum_year ? `currículo ${source.curriculum_year}`
    : source.document_year ? `documento de ${source.document_year}` : "";
  row.append(element("p", [source.institution, source.campus, source.source_type, date].filter(Boolean).join(" · "), "muted"));
  return row;
}

fetch("./catalogo.json").then(response => {
  if (!response.ok) throw new Error("Catálogo indisponível.");
  return response.json();
}).then(sources => {
  const indexed = sources.map(source => ({
    source,
    text: fold(Object.values(source).filter(value => value !== source.url).join(" "))
  }));
  document.getElementById("catalog-count").textContent = sources.length;
  for (const name of [...new Set(sources.map(source => source.institution))].sort()) {
    const option = element("option", name);
    option.value = name;
    catalogInstitution.append(option);
  }
  let visibleCount = 10;
  function showCatalog() {
    const terms = fold(catalogQuery.value).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    const selectedInstitution = catalogInstitution.value;
    const matches = indexed.filter(({source, text}) =>
      (!selectedInstitution || source.institution === selectedInstitution) && terms.every(term => text.includes(term))
    );
    catalogResults.replaceChildren(...matches.slice(0, visibleCount).map(({source}) => catalogItem(source)));
    if (matches.length === 1) catalogStatus.textContent = "1 registro encontrado.";
    else catalogStatus.textContent = matches.length
      ? `Exibindo ${Math.min(visibleCount, matches.length)} de ${matches.length} registros.`
      : "Nenhum registro encontrado. Tente outros termos ou instituições.";
    catalogMore.hidden = visibleCount >= matches.length;
  }
  function resetCatalog() { visibleCount = 10; showCatalog(); }
  catalogForm.addEventListener("submit", event => { event.preventDefault(); resetCatalog(); });
  catalogInstitution.addEventListener("change", resetCatalog);
  catalogMore.addEventListener("click", () => { visibleCount += 10; showCatalog(); });
  showCatalog();
}).catch(error => { catalogStatus.textContent = error.message; });
