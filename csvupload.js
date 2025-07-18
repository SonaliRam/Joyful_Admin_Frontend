// Updated csvupload.js with field validation, file size checks, error logging, and progress bar

let structuredData = [];
let fileSelected = false;
let csvErrors = [];

const CAT_URL = "http://localhost:8080/categories";
const SUB_URL = "http://localhost:8080/subcategories";
const PROD_URL = "http://localhost:8080/products";

function showError(message) {
  const existing = document.getElementById("error-popup");
  if (existing) existing.remove();

  const div = document.createElement("div");
  div.id = "error-popup";
  div.textContent = message;
  div.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #ffe0e0;
    padding: 16px 24px;
    border: 2px solid red;
    border-radius: 8px;
    font-size: 18px;
    z-index: 1000;
  `;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

function showCSVErrors() {
  if (!csvErrors.length) return;
  const table = document.createElement("table");
  table.style.cssText = "border-collapse: collapse; margin-top: 10px; background: #fff; border: 1px solid #ccc;";
  table.innerHTML = `
    <thead><tr><th style='padding: 6px; border: 1px solid #ccc;'>Row</th><th style='padding: 6px; border: 1px solid #ccc;'>Issue</th></tr></thead>
    <tbody>
      ${csvErrors
        .map(e => `<tr><td style='padding: 6px; border: 1px solid #ccc;'>${e.row}</td><td style='padding: 6px; border: 1px solid #ccc;'>${e.issue}</td></tr>`)
        .join("")}
    </tbody>`;
  const div = document.getElementById("error-container");
  div.innerHTML = `<strong>⚠️ Skipped Rows:</strong>`;
  div.appendChild(table);
}

function isTruthy(value) {
  return value != null && String(value).trim().length > 0;
}

function handleCSVData(csvRows) {
  structuredData = [];
  csvErrors = [];

  const header = csvRows[0];
  const mandatoryFields = [
    "CategoryName", "CategoryDesc", "CategorySearch", "CategoryImage",
    "CategorySeoTitle", "CategorySeoKeywords", "CategorySeoDesc", "CategoryPublished",
    "SubcategoryName", "SubcategoryImage", "SubcategoryMetaTitle", "SubcategoryPublished",
    "SubcategoryDesc", "SubcategoryMetaDesc", "SubcategoryKeywords",
    "ProductName", "ProductDesc", "ProductImage", "ProductTags", "ProductFilter",
    "ProductMetaTitle", "ProductMetaDesc", "ProductKeywords", "ProductPublished"
  ];

  for (let i = 1; i < csvRows.length; i++) {
    const row = csvRows[i];
    if (!row || row.length === 0 || row.every(cell => !cell.trim())) continue;

    const r = {};
    header.forEach((h, j) => (r[h.trim()] = (row[j] || "").trim()));

    const missing = mandatoryFields.filter(f => !isTruthy(r[f]));
    if (missing.length) {
      csvErrors.push({ row: i + 1, issue: `Missing fields: ${missing.join(", ")}` });
      continue;
    }

    let variantsObj = {};
    if (r.ProductVariantsMap) {
      try {
        variantsObj = JSON.parse(r.ProductVariantsMap);
      } catch {
        csvErrors.push({ row: i + 1, issue: `Invalid JSON in ProductVariantsMap` });
        continue;
      }
    }

    let cat = structuredData.find(c => c.name === r.CategoryName);
    if (!cat) {
      cat = {
        name: r.CategoryName,
        description: r.CategoryDesc,
        searchkeywords: r.CategorySearch,
        imagelink: r.CategoryImage,
        seotitle: r.CategorySeoTitle,
        seokeywords: r.CategorySeoKeywords,
        seodescription: r.CategorySeoDesc,
        published: r.CategoryPublished.toLowerCase() !== "false",
        subcategories: []
      };
      structuredData.push(cat);
    }

    let sub = cat.subcategories.find(s => s.name === r.SubcategoryName);
    if (!sub) {
      sub = {
        name: r.SubcategoryName,
        imagepath: r.SubcategoryImage,
        metatitle: r.SubcategoryMetaTitle,
        ispublished: r.SubcategoryPublished.toLowerCase() !== "false",
        description: r.SubcategoryDesc,
        metadescription: r.SubcategoryMetaDesc,
        seokeywords: r.SubcategoryKeywords,
        products: []
      };
      cat.subcategories.push(sub);
    }

    sub.products.push({
      name: r.ProductName,
      description: r.ProductDesc,
      mainimage: r.ProductImage,
      producttags: r.ProductTags.split(/[,;]/).map(t => t.trim()).filter(Boolean),
      filter: r.ProductFilter,
      metatitle: r.ProductMetaTitle,
      metadescription: r.ProductMetaDesc,
      pagekeywords: r.ProductKeywords,
      ispublished: r.ProductPublished.toLowerCase() !== "false",
      variantsMap: variantsObj
    });
  }

  renderPreview();
  showCSVErrors();
}

async function submitBulkData() {
  if (!fileSelected || structuredData.length === 0) {
    showError("❌ Please select a CSV file first");
    return;
  }

  const progressContainer = document.getElementById("progressContainer");
  const progressBar = document.getElementById("progressBar");
  progressContainer.style.display = "block";
  progressBar.style.width = "0%";

  let total = structuredData.reduce((sum, cat) => sum + 1 + cat.subcategories.length + cat.subcategories.reduce((s, sub) => s + sub.products.length, 0), 0);
  let current = 0;

  try {
    for (const cat of structuredData) {
      const savedCat = await postJSON(CAT_URL, cat);
      current++;
      progressBar.style.width = `${Math.round((current / total) * 100)}%`;

      for (const sub of cat.subcategories) {
        sub.categoryIds = [savedCat.id];
        const savedSub = await postJSON(SUB_URL, sub);
        current++;
        progressBar.style.width = `${Math.round((current / total) * 100)}%`;

        for (const prod of sub.products) {
          prod.subcategoryIds = [savedSub.id];
          await postJSON(PROD_URL, prod);
          current++;
          progressBar.style.width = `${Math.round((current / total) * 100)}%`;
        }
      }
    }
    alert("✅ All data created successfully!");
    progressBar.style.width = "100%";
  } catch (err) {
    console.error(err);
    alert("❌ Operation failed: " + err.message);
  } finally {
    setTimeout(() => {
      progressBar.style.width = "0%";
      progressContainer.style.display = "none";
    }, 1000);
  }
}

document.getElementById("csvInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const isCSV = file.type === "text/csv" || file.name.endsWith(".csv");
  if (!isCSV) {
    showError("❌ Only CSV file allowed");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showError("❌ File too large (max 10MB)");
    return;
  }

  Papa.parse(file, {
    complete: (res) => {
      fileSelected = true;
      handleCSVData(res.data);
    }
  });
});
