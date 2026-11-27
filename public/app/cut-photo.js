window.CutPhoto = (() => {
  const text = {
    he: {
      prompt: "צלמו את הנתח באור טוב. אם יש אריזה עם שם הנתח, אפשר לצלם גם אותה.",
      camera: "צילום במצלמה", gallery: "בחירה מהגלריה", preview: "התמונה שנבחרה לניתוח",
      stage: "מה מצב הנתח?", unknown: "לא בטוח", raw: "לפני בישול", cooked: "מבושל ומוכן להגשה",
      analyze: "זהה נתח והצע רעיונות", disclosure: "בלחיצה על הזיהוי תישלח תמונה מוקטנת ל־OpenAI.",
      preparing: "מכין את התמונה…", analyzing: "בודק את התמונה…", choose: "בחרו תמונה כדי להתחיל.",
      fileError: "לא הצלחנו לפתוח את התמונה. נסו לצלם שוב או לבחור קובץ JPG או PNG.",
      tooLarge: "התמונה גדולה מדי. נסו גרסה קטנה יותר.", busy: "הזיהוי עמוס כרגע. אפשר לנסות שוב בעוד רגע.",
      unavailable: "הזיהוי לא זמין כרגע. אפשר לנסות שוב או לבחור את הנתח ידנית.",
      suggested: "זיהוי משוער", uncertain: "קשה לזהות את הנתח מהתמונה", not_meat: "לא זוהה נתח בשר",
      ideas: "מה אפשר להכין?", serving: "רעיונות להגשה", recipe: "המשך למתכון עם הנתח הזה",
      manual: "יודעים איזה נתח זה? בחירה ידנית", manualLabel: "נתח בקר", placeholder: "בחרו נתח",
      manualCooked: "אם הנתח כבר מבושל ונפרס דק, אפשר להגיש אותו בכריך עם חרדל ומלפפון חמוץ. אם הוא מתפרק לסיבים, נסו אותו על תפוחי אדמה צלויים עם בצל.",
      manualRaw: "אפשר לבחור ציוד ושיטת בישול במחולל המתכונים.",
      stageHint: "בחרו למעלה אם הנתח לפני בישול או כבר מבושל כדי להמשיך.",
      activeCut: "הנתח שבחרתם"
    },
    en: {
      prompt: "Photograph the cut in good light. If the packaging names the cut, you can photograph the label too.",
      camera: "Take a photo", gallery: "Choose a photo", preview: "Selected cut photo",
      stage: "How is the meat prepared?", unknown: "Not sure", raw: "Before cooking", cooked: "Fully cooked, ready to serve",
      analyze: "Identify cut and suggest ideas", disclosure: "Choosing Identify sends a resized photo to OpenAI.",
      preparing: "Preparing photo…", analyzing: "Checking the photo…", choose: "Choose a photo to start.",
      fileError: "Could not open this image. Take another photo or choose a JPG or PNG.",
      tooLarge: "This image is too large. Try a smaller copy.", busy: "Photo analysis is busy. Try again shortly.",
      unavailable: "Photo analysis is unavailable. Try again or choose the cut manually.",
      suggested: "Possible cut", uncertain: "The cut is hard to identify from this photo", not_meat: "No meat cut identified",
      ideas: "What could I make?", serving: "Serving ideas", recipe: "Continue to a recipe with this cut",
      manual: "Know the cut? Choose manually", manualLabel: "Beef cut", placeholder: "Choose a cut",
      manualCooked: "If the cooked meat slices thinly, try a sandwich with mustard and pickles. For pull-apart meat, serve it over roasted potatoes with onions.",
      manualRaw: "Choose your equipment and cooking method in the recipe generator.",
      stageHint: "Choose before cooking or fully cooked above to continue.", activeCut: "Your selected cut"
    }
  };

  async function resize(file, tooLarge) {
    if (file.size > 25 * 1024 * 1024) throw Error(tooLarge);
    if (file.type && (!file.type.startsWith("image/") || file.type === "image/svg+xml")) throw Error("format");
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(Error("format"));
        image.src = url;
      });
      const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.82, 0.62]) {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
        if (blob && blob.size <= 1024 * 1024) return blob;
      }
      throw Error(tooLarge);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function mount(root, lang, catalog, openRecipe) {
    const t = text[lang] || text.he;
    root.innerHTML = `<section class="card cut-photo">
      <p>${t.prompt}</p>
      <div class="cut-photo-actions">
        <button type="button" class="btn btn-choice" id="cutCameraBtn">${t.camera}</button>
        <button type="button" class="btn btn-ghost" id="cutGalleryBtn">${t.gallery}</button>
      </div>
      <input type="file" id="cutCamera" accept="image/*" capture="environment" hidden>
      <input type="file" id="cutGallery" accept="image/*" hidden>
      <img id="cutPreview" alt="${t.preview}" data-ph-no-capture class="ph-no-capture" hidden>
      <div class="field"><label for="cutStage">${t.stage}</label>
        <select id="cutStage"><option value="unknown">${t.unknown}</option><option value="raw">${t.raw}</option><option value="cooked">${t.cooked}</option></select>
      </div>
      <small>${t.disclosure}</small>
      <button type="button" class="btn btn-primary" id="cutAnalyze" disabled>${t.analyze}</button>
      <p class="small" role="status" aria-live="polite" id="cutStatus">${t.choose}</p>
      <section id="cutAnswer" aria-live="polite" hidden>
        <h2 id="cutName"></h2><p id="cutObservation"></p><h3 id="ideasTitle"></h3><ul id="cutIdeas"></ul>
      </section>
      <details id="manualCutDetails"><summary>${t.manual}</summary>
        <div class="field"><label for="photoCutId">${t.manualLabel}</label><select id="photoCutId"></select></div>
      </details>
      <p id="cutAdvice" class="small" hidden></p>
      <button id="photoRecipe" type="button" class="btn btn-primary" hidden>${t.recipe}</button>
    </section>`;
    const byId = id => root.querySelector("#" + id);
    const stage = byId("cutStage"), analyze = byId("cutAnalyze"), status = byId("cutStatus");
    const answer = byId("cutAnswer"), manual = byId("photoCutId"), recipe = byId("photoRecipe");
    const preview = byId("cutPreview"), advice = byId("cutAdvice");
    let fileBlob = null, previewUrl = null, prediction = null, controller = null, generation = 0;
    let predictionStage = null;
    manual.add(new Option(t.placeholder, ""));
    for (const cut of catalog) manual.add(new Option(cut.labels[lang], cut.id));

    function selectedCut() {
      return manual.value || prediction?.cutId;
    }
    function updateAction() {
      const selected = selectedCut();
      recipe.hidden = !selected || stage.value !== "raw";
      advice.hidden = !selected || (!manual.value && stage.value !== "unknown" && predictionStage === stage.value);
      if (!advice.hidden) {
        const label = catalog.find(cut => cut.id === selected)?.labels[lang];
        const message = stage.value === "unknown" ? t.stageHint : stage.value === "cooked" ? t.manualCooked : t.manualRaw;
        advice.textContent = manual.value ? t.activeCut + " · " + label + ". " + message : message;
      }
      answer.hidden = Boolean(manual.value) || !prediction;
      const showIdeas = predictionStage === stage.value && Boolean(prediction?.ideas.length);
      byId("cutIdeas").hidden = !showIdeas;
      byId("ideasTitle").hidden = !showIdeas;
    }
    function clearResult() {
      prediction = null;
      manual.value = "";
      updateAction();
    }
    function invalidate() {
      generation++;
      controller?.abort();
      controller = null;
    }
    function releasePreview() {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = null;
      fileBlob = null;
      preview.removeAttribute("src");
      preview.hidden = true;
    }
    async function selectFile(input) {
      const file = input.files[0];
      if (!file) return;
      input.value = "";
      invalidate();
      const turn = generation;
      releasePreview();
      clearResult();
      analyze.disabled = true;
      status.textContent = t.preparing;
      try {
        const blob = await resize(file, t.tooLarge);
        if (generation !== turn) return;
        fileBlob = blob;
        previewUrl = URL.createObjectURL(blob);
        preview.src = previewUrl;
        preview.hidden = false;
        analyze.disabled = false;
        status.textContent = "";
      } catch (error) {
        if (generation === turn) status.textContent = error.message === t.tooLarge ? t.tooLarge : t.fileError;
      }
    }
    for (const id of ["cutCamera", "cutGallery"]) {
      const input = byId(id);
      byId(id + "Btn").onclick = () => input.click();
      input.onchange = () => selectFile(input);
    }
    stage.onchange = () => {
      if (controller) invalidate();
      analyze.disabled = !fileBlob;
      if (fileBlob) status.textContent = "";
      updateAction();
    };
    manual.onchange = updateAction;
    recipe.onclick = () => {
      if (stage.value === "raw" && selectedCut()) openRecipe(selectedCut(), manual.value ? "beef" : prediction.species);
    };
    analyze.onclick = async () => {
      if (!fileBlob || controller) return;
      invalidate();
      const turn = generation;
      controller = new AbortController();
      analyze.disabled = true;
      clearResult();
      status.textContent = t.analyzing;
      try {
        const params = new URLSearchParams({ lang, stage: stage.value });
        const response = await fetch("/api/identify-cut?" + params, {
          method: "POST", headers: { "Content-Type": "image/jpeg" }, body: fileBlob, signal: controller.signal
        });
        if (!response.ok) {
          const errors = { 400: t.fileError, 413: t.tooLarge, 415: t.fileError, 429: t.busy };
          throw Error(errors[response.status] || t.unavailable);
        }
        const result = await response.json();
        if (generation !== turn) return;
        prediction = result;
        predictionStage = stage.value;
        byId("cutName").textContent = result.status === "suggested" ? t.suggested + " · " + result.cutName : t[result.status];
        byId("cutObservation").textContent = result.observation;
        const list = byId("cutIdeas");
        list.replaceChildren();
        for (const idea of result.ideas) {
          const li = document.createElement("li");
          li.textContent = idea;
          list.append(li);
        }
        byId("ideasTitle").textContent = stage.value === "cooked" ? t.serving : t.ideas;
        updateAction();
        status.textContent = "";
        answer.scrollIntoView?.({ block: "nearest" });
      } catch (error) {
        if (generation === turn) status.textContent = [t.fileError, t.tooLarge, t.busy].includes(error.message) ? error.message : t.unavailable;
      } finally {
        if (generation === turn) {
          controller = null;
          analyze.disabled = !fileBlob;
        }
      }
    };
    return () => { invalidate(); releasePreview(); };
  }
  return { mount };
})();
