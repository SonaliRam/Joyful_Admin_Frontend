const baseUrl = "http://localhost:8080/products";
const subcategoryUrl = "http://localhost:8080/subcategories";

let allSubcategories = [];
let selectedSubcategoryIds = [];
let quill;

window.onload = async () => {
  // Initialize Quill
  quill = new Quill("#productDescriptionEditor", {
    theme: "snow",
    placeholder: "Write product description...",
    modules: {
      toolbar: [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["clean"],
      ],
    },
  });

  document.addEventListener("click", handleOutsideClick);
  document
    .getElementById("addProductForm")
    .addEventListener("submit", handleAddProductSubmit);

  await loadSubcategories(); // ✅ ensure this loads before edit prefill

  const id = new URLSearchParams(window.location.search).get("id");
  if (id) {
    loadProductForEdit(id); // ✅ edit prefill
  }
};

// ⬇️ Same functions from your product.js — no changes needed
function previewMainImage() {
  const url = document.getElementById("mainImage").value;
  const img = document.getElementById("mainImagePreview");
  img.src = url || "";
  img.style.display = url ? "block" : "none";
}

function addVariantRow() {
  const container = document.getElementById("variantsContainer");
  const div = document.createElement("div");
  div.classList.add("variantRow");
  div.innerHTML = `
    <select required>
      <option value="">Select Option Name</option>
      <option value="Color">Color</option>
      <option value="Size">Size</option>
      <option value="Material">Material</option>
    </select>
    <input type="text" placeholder="Enter option values comma-separated" required />
  `;
  container.appendChild(div);
}

function toggleColorImageSection() {
  const container = document.getElementById("colorImageContainer");
  container.style.display = "block";
  addColorImageRow();
}

function addColorImageRow() {
  const container = document.getElementById("colorImageContainer");
  const row = document.createElement("div");
  row.className = "colorImageRow";
  row.style.cssText =
    "display: flex; align-items: center; gap: 10px; margin-bottom: 10px;";

  const colorInputId = `colorInput-${Date.now()}`;

  row.innerHTML = `
    <div style="display: flex; align-items: center; gap: 6px; width: 100px;">
      <input type="color" id="${colorInputId}" value="#000000" required
        style="
          width: 100%;
          height: 40px;
          border: none;
          padding: 0;
          appearance: none;
          cursor: pointer;
          border-radius: 6px;
        "
      />
      <span id="${colorInputId}-code" style="font-size: 14px;">#000000</span>
    </div>
    <input type="url" placeholder="Paste image URL" required class="input-field" style="flex: 1;" />
  `;

  container.appendChild(row);

  const colorInput = document.getElementById(colorInputId);
  const colorCode = document.getElementById(`${colorInputId}-code`);

  // Update the code when color changes
  colorInput.addEventListener("input", () => {
    colorCode.textContent = colorInput.value;
  });
}

function toggleSubcategoryDropdown() {
  const dropdown = document.getElementById("subcategoryDropdownList");
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
}

function handleOutsideClick(e) {
  const dropdown = document.getElementById("subcategoryDropdownList");
  const customSelect = document.querySelector(".subcategory-multi-select");
  if (!customSelect.contains(e.target)) {
    dropdown.style.display = "none";
  }
}

async function loadSubcategories() {
  try {
    const res = await fetch(subcategoryUrl);
    allSubcategories = await res.json();
    const dropdownList = document.getElementById("subcategoryDropdownList");
    dropdownList.innerHTML = allSubcategories
      .map(
        (sub) => `
      <div class="dropdown-item" data-id="${sub.id}" onclick="selectSubcategory(${sub.id}, '${sub.name}')" style="padding: 6px; cursor: pointer; border-bottom: 1px solid #eee;">${sub.name}</div>
    `
      )
      .join("");
  } catch (err) {
    console.error("Error loading subcategories:", err);
  }
}

function selectSubcategory(id, name) {
  if (selectedSubcategoryIds.includes(id)) return;
  selectedSubcategoryIds.push(id);
  const tag = document.createElement("span");
  tag.classList.add("tag");
  tag.setAttribute("data-id", id);
  tag.style.cssText =
    "background: #e0e0e0; padding: 4px 8px; margin: 2px; border-radius: 5px; display: flex; align-items: center;";
  tag.innerHTML = `${name}<span style="margin-left: 6px; cursor: pointer;" onclick="removeSubcategory(${id})">❌</span>`;
  document.getElementById("selectedSubcategories").appendChild(tag);
  document.querySelector(".subcategory-multi-select").style.border = ""; // clear red border on valid selection
}

function removeSubcategory(id) {
  selectedSubcategoryIds = selectedSubcategoryIds.filter((sid) => sid !== id);
  const tag = document.querySelector(
    `#selectedSubcategories span[data-id="${id}"]`
  );
  if (tag) tag.remove();
}

function resetSubcategorySelector() {
  selectedSubcategoryIds = [];
  document.getElementById("selectedSubcategories").innerHTML = "";
}

async function handleAddProductSubmit(e) {
  e.preventDefault();
  if (selectedSubcategoryIds.length === 0) {
    const selectBox = document.querySelector(".subcategory-multi-select");
    selectBox.style.border = "2px solid red";
    alert("Please select at least one subcategory.");
    return;
  }

  const variantsMap = {};
  document.querySelectorAll("#variantsContainer .variantRow").forEach((row) => {
    const key = row.querySelector("select").value;
    const value = row.querySelector("input").value;
    if (key && value) variantsMap[key] = value;
  });

  const colorImages = Object.fromEntries(
    Array.from(
      document.querySelectorAll("#colorImageContainer .colorImageRow")
    ).map((row) => {
      const color = row.querySelectorAll("input")[0].value;
      const url = row.querySelectorAll("input")[1].value;
      return [color, url];
    })
  );

  const tags = document
    .getElementById("productTags")
    .value.trim()
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const product = {
    name: document.getElementById("productName").value,
    description: quill.root.innerHTML,
    size: document.getElementById("productSize").value,
    mainimage: document.getElementById("mainImage").value,
    filter: document.getElementById("productFilter").value,
    producttags: tags,
    metatitle: document.getElementById("metaTitle").value,
    metadescription: document.getElementById("metaDescription").value,
    pagekeywords: document.getElementById("pageKeywords").value,
    ispublished:
      document.querySelector('input[name="ispublished"]:checked')?.value ===
      "true",
    variation: Object.keys(variantsMap).length > 0 ? "true" : "false",
    variantsMap,
    colorimages: colorImages,
    subcategories: selectedSubcategoryIds.map((id) => ({ id })),
  };

  const id = new URLSearchParams(window.location.search).get("id");
  await fetch(`${baseUrl}${id ? "/" + id : ""}`, {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  });

  window.location.href = "product.html";
}

async function loadProductForEdit(id) {
  try {
    const res = await fetch(`${baseUrl}/${id}`);
    const product = await res.json();

    document.getElementById("productName").value = product.name;
    document.getElementById("productSize").value = product.size;
    document.getElementById("mainImage").value = product.mainimage;
    previewMainImage();
    document.getElementById("productFilter").value = product.filter || "";
    document.getElementById("productTags").value = (
      product.producttags || []
    ).join(", ");
    document.getElementById("metaTitle").value = product.metatitle;
    document.getElementById("metaDescription").value = product.metadescription;
    document.getElementById("pageKeywords").value = product.pagekeywords;
    document.querySelector(
      `input[name="ispublished"][value="${product.ispublished}"]`
    ).checked = true;

    quill.root.innerHTML = product.description || "";

    resetSubcategorySelector();
    product.subcategories?.forEach((sub) =>
      selectSubcategory(sub.id, sub.name)
    );

    document.getElementById("variantsContainer").innerHTML = "";
    if (product.variation === "true" && product.variantsMap) {
      for (const [key, value] of Object.entries(product.variantsMap)) {
        const div = document.createElement("div");
        div.classList.add("variantRow");
        div.innerHTML = `
          <select required>
            <option value="">Select Option Name</option>
            <option value="Color" ${
              key === "Color" ? "selected" : ""
            }>Color</option>
            <option value="Size" ${
              key === "Size" ? "selected" : ""
            }>Size</option>
            <option value="Material" ${
              key === "Material" ? "selected" : ""
            }>Material</option>
          </select>
          <input type="text" value="${value}" required />
        `;
        document.getElementById("variantsContainer").appendChild(div);
      }
    }

    document.getElementById("colorImageContainer").innerHTML = "";
    if (product.colorimages) {
      document.getElementById("colorImageContainer").style.display = "block";
      Object.entries(product.colorimages).forEach(([color, url]) => {
        const row = document.createElement("div");
        row.className = "colorImageRow";
        const colorInputId = `colorInput-${Date.now()}`;
        row.innerHTML = `
          <div style="display: flex; align-items: center; gap: 6px;">
            <input type="color" id="${colorInputId}" value="${color}" required style="width: 30px;" />
            <span id="${colorInputId}-code" style="font-size: 14px;">${color}</span>
          </div>
          <input type="url" value="${url}" required class="input-field" style="flex: 1;" />
        `;
        document.getElementById("colorImageContainer").appendChild(row);
        document.getElementById(colorInputId).addEventListener("input", (e) => {
          document.getElementById(`${colorInputId}-code`).textContent =
            e.target.value;
        });
      });
    }
  } catch (err) {
    console.error("Error loading product for edit:", err);
  }
}
