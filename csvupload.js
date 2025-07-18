// Updated csvupload.js with field validation, file size checks, error logging, and progress bar

let structuredData = [];
let fileSelected = false;
let csvErrors = [];

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
  table.style.cssText =
    "border-collapse: collapse; margin-top: 10px; background: #fff; border: 1px solid #ccc;";
  table.innerHTML = `
    <thead><tr><th style='padding: 6px; border: 1px solid #ccc;'>Row</th><th style='padding: 6px; border: 1px solid #ccc;'>Issue</th></tr></thead>
    <tbody>
      ${csvErrors
        .map(
          (e) =>
            `<tr><td style='padding: 6px; border: 1px solid #ccc;'>${e.row}</td><td style='padding: 6px; border: 1px solid #ccc;'>${e.issue}</td></tr>`
        )
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
  renderPreview(); // Clear existing preview

  const header = csvRows[0];
  const mandatoryFields = [
    "CategoryName",
    "CategoryDesc",
    "CategorySearch",
    "CategoryImage",
    "CategorySeoTitle",
    "CategorySeoKeywords",
    "CategorySeoDesc",
    "CategoryPublished",
    "SubcategoryName",
    "SubcategoryImage",
    "SubcategoryMetaTitle",
    "SubcategoryPublished",
    "SubcategoryDesc",
    "SubcategoryMetaDesc",
    "SubcategoryKeywords",
    "ProductName",
    "ProductDesc",
    "ProductImage",
    "ProductTags",
    "ProductFilter",
    "ProductMetaTitle",
    "ProductMetaDesc",
    "ProductKeywords",
    "ProductPublished",
  ];

  for (let i = 1; i < csvRows.length; i++) {
    const row = csvRows[i];
    if (!row || row.length === 0 || row.every((cell) => !cell.trim())) continue;

    const r = {};
    header.forEach((h, j) => (r[h.trim()] = (row[j] || "").trim()));

    const missing = mandatoryFields.filter((f) => !isTruthy(r[f]));
    if (missing.length) {
      csvErrors.push({
        row: i + 1,
        issue: `Missing fields: ${missing.join(", ")}`,
      });
      continue;
    }

    // Validate ProductVariantsMap
    const variantsMap = r.ProductVariantsMap || "{}";
    let hasInvalidVariants = false;

    if (variantsMap.trim() !== "" && variantsMap !== "{}") {
      try {
        JSON.parse(variantsMap);
      } catch (e) {
        csvErrors.push({
          row: i + 1,
          issue: `Invalid ProductVariantsMap format - must be valid JSON (e.g., {"color":["red"]})`,
        });
        hasInvalidVariants = true;
      }
    }

    let cat = structuredData.find((c) => c.name === r.CategoryName);
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
        subcategories: [],
      };
      structuredData.push(cat);
    }

    let sub = cat.subcategories.find((s) => s.name === r.SubcategoryName);
    if (!sub) {
      sub = {
        name: r.SubcategoryName,
        imagepath: r.SubcategoryImage,
        metatitle: r.SubcategoryMetaTitle,
        ispublished: r.SubcategoryPublished.toLowerCase() !== "false",
        description: r.SubcategoryDesc,
        metadescription: r.SubcategoryMetaDesc,
        seokeywords: r.SubcategoryKeywords,
        products: [],
      };
      cat.subcategories.push(sub);
    }

    sub.products.push({
      name: r.ProductName,
      description: r.ProductDesc,
      mainimage: r.ProductImage,
      producttags: r.ProductTags.split(/[,;]/)
        .map((t) => t.trim())
        .filter(Boolean),
      filter: r.ProductFilter,
      metatitle: r.ProductMetaTitle,
      metadescription: r.ProductMetaDesc,
      pagekeywords: r.ProductKeywords,
      ispublished: r.ProductPublished.toLowerCase() !== "false",
      variantsMap: variantsMap,
      _hasInvalidVariants: hasInvalidVariants, // Flag for rendering
    });
  }

  renderPreview();
  showCSVErrors();
}

function renderPreview() {
  const previewDiv = document.getElementById("preview");
  if (!previewDiv) return;

  previewDiv.innerHTML = ""; // clear old content

  structuredData.forEach((cat) => {
    const catDiv = document.createElement("div");
    catDiv.innerHTML = `<h3>Category: ${cat.name}</h3>`;

    cat.subcategories.forEach((sub) => {
      const subDiv = document.createElement("div");
      subDiv.innerHTML = `<h4>Subcategory: ${sub.name}</h4><ul>`;

      sub.products.forEach((prod) => {
        const li = document.createElement("li");
        li.textContent = `Product: ${prod.name} - ${prod.description}`;

        if (prod._hasInvalidVariants) {
          li.style.color = "orange";
          li.textContent += " (⚠️ Check variants format)";
        }

        subDiv.querySelector("ul").appendChild(li);
      });

      catDiv.appendChild(subDiv);
    });

    previewDiv.appendChild(catDiv);
  });
}

function handleCSVData(csvRows) {
  structuredData = [];
  csvErrors = [];
  renderPreview(); // Just clear preview

  const header = csvRows[0];
  const mandatoryFields = [
    "CategoryName",
    "CategoryDesc",
    "CategorySearch",
    "CategoryImage",
    "CategorySeoTitle",
    "CategorySeoKeywords",
    "CategorySeoDesc",
    "CategoryPublished",
    "SubcategoryName",
    "SubcategoryImage",
    "SubcategoryMetaTitle",
    "SubcategoryPublished",
    "SubcategoryDesc",
    "SubcategoryMetaDesc",
    "SubcategoryKeywords",
    "ProductName",
    "ProductDesc",
    "ProductImage",
    "ProductTags",
    "ProductFilter",
    "ProductMetaTitle",
    "ProductMetaDesc",
    "ProductKeywords",
    "ProductPublished",
  ];

  for (let i = 1; i < csvRows.length; i++) {
    const row = csvRows[i];
    if (!row || row.length === 0 || row.every((cell) => !cell.trim())) continue;

    const r = {};
    header.forEach((h, j) => (r[h.trim()] = (row[j] || "").trim()));

    const missing = mandatoryFields.filter((f) => !isTruthy(r[f]));
    if (missing.length) {
      csvErrors.push({
        row: i + 1,
        issue: `Missing fields: ${missing.join(", ")}`,
      });
      continue;
    }

    // Validate ProductVariantsMap
    const variantsMap = r.ProductVariantsMap || "{}";
    let hasInvalidVariants = false;

    if (variantsMap.trim() !== "" && variantsMap !== "{}") {
      try {
        JSON.parse(variantsMap);
      } catch (e) {
        csvErrors.push({
          row: i + 1,
          issue: `Invalid ProductVariantsMap format - must be valid JSON (e.g., {"color":["red"]})`,
        });
        hasInvalidVariants = true;
      }
    }

    let cat = structuredData.find((c) => c.name === r.CategoryName);
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
        subcategories: [],
      };
      structuredData.push(cat);
    }

    let sub = cat.subcategories.find((s) => s.name === r.SubcategoryName);
    if (!sub) {
      sub = {
        name: r.SubcategoryName,
        imagepath: r.SubcategoryImage,
        metatitle: r.SubcategoryMetaTitle,
        ispublished: r.SubcategoryPublished.toLowerCase() !== "false",
        description: r.SubcategoryDesc,
        metadescription: r.SubcategoryMetaDesc,
        seokeywords: r.SubcategoryKeywords,
        products: [],
      };
      cat.subcategories.push(sub);
    }

    sub.products.push({
      name: r.ProductName,
      description: r.ProductDesc,
      mainimage: r.ProductImage,
      producttags: r.ProductTags.split(/[,;]/)
        .map((t) => t.trim())
        .filter(Boolean),
      filter: r.ProductFilter,
      metatitle: r.ProductMetaTitle,
      metadescription: r.ProductMetaDesc,
      pagekeywords: r.ProductKeywords,
      ispublished: r.ProductPublished.toLowerCase() !== "false",

      variantsMap: variantsMap, // Just store the string value
    });
  }

  renderPreview();
  showCSVErrors();
}
async function postJSON(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `POST ${url} failed with status ${res.status}: ${errorBody}`
    );
  }

  return res.json(); // return saved object (e.g. category with `id`)
}

async function uploadCSVFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  // In uploadCSVFile:
  const invalidRows = csvErrors.filter((e) =>
    e.issue.includes("ProductVariantsMap")
  );
  if (invalidRows.length > 0) {
    if (
      !confirm(
        `${invalidRows.length} products have variant format issues. Continue anyway?`
      )
    ) {
      return;
    }
  }
  const statusElem = document.getElementById("uploadStatus");
  if (statusElem) statusElem.innerText = "⏳ Uploading...";

  try {
    const res = await fetch("http://localhost:8080/upload-csv", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error("Upload failed: " + errorText);
    }

    // Safely handle empty or non-JSON responses
    const contentType = res.headers.get("content-type");
    let result = null;
    if (contentType && contentType.includes("application/json")) {
      result = await res.json();
    } else {
      result = { message: await res.text() }; // fallback plain text
    }

    if (statusElem) statusElem.innerText = "✅ Upload complete!";
    alert("✅ Upload successful!");
    console.log("Upload result:", result);
    renderBackendResult(result); // Optional
  } catch (err) {
    console.error("Upload error:", err);
    showError("❌ Upload failed: " + err.message);
    if (statusElem) statusElem.innerText = "❌ Upload failed";
  }
}

function renderBackendResult(result) {
  const skipped = result.skippedRowsList;
  if (!Array.isArray(skipped) || skipped.length === 0) return;

  const table = document.createElement("table");
  // In renderBackendResult:
  table.innerHTML = `
    <thead>
        <tr>
            <th>Row</th>
            <th>Issue</th>
            <th>Suggested Fix</th>
        </tr>
    </thead>
    <tbody>
        ${skipped
          .map(
            (row) => `
            <tr>
                <td>${row.rowNumber}</td>
                <td>${row.reason.split("(")[0]}</td>
                <td>${
                  row.reason.includes("ProductVariantsMap")
                    ? 'Convert to JSON format (e.g., {"size":["XL"]})'
                    : "Check required fields"
                }</td>
            </tr>
        `
          )
          .join("")}
    </tbody>`;
  const div = document.getElementById("error-container");
  div.innerHTML = `<strong>⚠️ Skipped Rows:</strong>`;
  div.appendChild(table);
  // In renderBackendResult:
  if (result.message) {
    const msgDiv = document.createElement("div");
    msgDiv.textContent = result.message;
    document.getElementById("error-container").appendChild(msgDiv);
  }
}

document.getElementById("csvInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) {
    showError("No file selected");
    return;
  }

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
      uploadCSVFile(file); // 👈 Add this line
    },
  });
});
function submitBulkData() {
  const fileInput = document.getElementById("csvInput");
  if (!fileInput.files || fileInput.files.length === 0) {
    showError("❌ Please select a CSV file first");
    return;
  }
  // Trigger the file processing
  fileInput.dispatchEvent(new Event("change"));
}
