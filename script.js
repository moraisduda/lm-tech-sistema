"use strict";


/* =========================================================
   CONFIGURAÇÃO E DADOS
========================================================= */

const STORAGE_KEY = "lmtech_data";

const defaultData = {
    users: [
        {
            id: 1,
            username: "admin",
            password: "1234",
            name: "Administrador",
            role: "Administrador"
        }
    ],

    products: [
        {
            id: 1,
            name: "Coca-Cola 350ml",
            code: "001",
            price: 6.00,
            stock: 20,
            minStock: 5
        },
        {
            id: 2,
            name: "Água Mineral 500ml",
            code: "002",
            price: 3.00,
            stock: 30,
            minStock: 8
        },
        {
            id: 3,
            name: "Salgadinho",
            code: "003",
            price: 7.50,
            stock: 12,
            minStock: 5
        }
    ],

    sales: [],

    cash: {
        opened: false,
        initial: 0,
        openedAt: null,
        movements: []
    },

    settings: {
        storeName: "LM TECH",
        document: "",
        phone: ""
    }
};


let data = loadData();

let currentUser = null;

let currentPage = "dashboard";

let cart = [];

let reportPeriod = "day";


/* =========================================================
   ELEMENTOS
========================================================= */

const loginScreen = document.getElementById("loginScreen");
const app = document.getElementById("app");

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

const openSidebarButton = document.getElementById("openSidebar");
const closeSidebarButton = document.getElementById("closeSidebar");

const logoutButton = document.getElementById("logoutButton");

const modalOverlay = document.getElementById("modalOverlay");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const closeModalButton = document.getElementById("closeModal");

const toastContainer = document.getElementById("toastContainer");


/* =========================================================
   STORAGE
========================================================= */

function loadData() {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
        return structuredClone(defaultData);
    }

    try {

        const parsed = JSON.parse(saved);

        return {
            ...structuredClone(defaultData),
            ...parsed,
            settings: {
                ...defaultData.settings,
                ...(parsed.settings || {})
            },
            cash: {
                ...defaultData.cash,
                ...(parsed.cash || {}),
                movements: parsed.cash?.movements || []
            }
        };

    } catch (error) {

        console.error(error);

        return structuredClone(defaultData);
    }
}


function saveData() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}


/* =========================================================
   UTILIDADES
========================================================= */

function money(value) {

    return Number(value || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}


function number(value) {

    return Number(value || 0);
}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function generateId() {

    return Date.now() + Math.floor(Math.random() * 1000);
}


function formatDate(date) {

    return new Date(date).toLocaleString(
        "pt-BR"
    );
}


function dateOnly(date) {

    return new Date(date).toLocaleDateString(
        "pt-BR"
    );
}


function todayStart() {

    const date = new Date();

    date.setHours(0, 0, 0, 0);

    return date;
}


function isToday(date) {

    return new Date(date) >= todayStart();
}


function getWeekStart() {

    const date = new Date();

    const day = date.getDay();

    const difference = day === 0 ? 6 : day - 1;

    date.setDate(date.getDate() - difference);

    date.setHours(0, 0, 0, 0);

    return date;
}


function getMonthStart() {

    const date = new Date();

    date.setDate(1);

    date.setHours(0, 0, 0, 0);

    return date;
}


function getCompletedSales() {

    return data.sales.filter(
        sale => sale.status === "completed"
    );
}


function getCurrentCashBalance() {

    let balance = number(data.cash.initial);

    data.cash.movements.forEach(
        movement => {

            if (movement.type === "in") {
                balance += number(movement.value);
            }

            if (movement.type === "out") {
                balance -= number(movement.value);
            }

        }
    );

    return balance;
}


function getCashIn() {

    return data.cash.movements
        .filter(m => m.type === "in")
        .reduce(
            (sum, movement) =>
                sum + number(movement.value),
            0
        );
}


function getCashOut() {

    return data.cash.movements
        .filter(m => m.type === "out")
        .reduce(
            (sum, movement) =>
                sum + number(movement.value),
            0
        );
}


function lowStockProducts() {

    return data.products.filter(
        product =>
            number(product.stock) <=
            number(product.minStock)
    );
}


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        const username =
            document.getElementById("loginUser")
                .value
                .trim();

        const password =
            document.getElementById("loginPassword")
                .value;

        const user = data.users.find(
            item =>
                item.username === username &&
                item.password === password
        );

        if (!user) {

            loginError.textContent =
                "Usuário ou senha inválidos.";

            return;
        }

        currentUser = user;

        loginError.textContent = "";

        sessionStorage.setItem(
            "lmtech_logged",
            String(user.id)
        );

        showApp();

    }
);


function showApp() {

    loginScreen.classList.add("hidden");

    app.classList.remove("hidden");

    document.getElementById(
        "currentUserName"
    ).textContent = currentUser.name;

    document.getElementById(
        "currentUserAvatar"
    ).textContent =
        currentUser.name
            .charAt(0)
            .toUpperCase();

    document.getElementById(
        "settingsUsername"
    ).textContent = currentUser.username;

    updateAll();

}


function logout() {

    currentUser = null;

    sessionStorage.removeItem(
        "lmtech_logged"
    );

    app.classList.add("hidden");

    loginScreen.classList.remove("hidden");

    document.getElementById(
        "loginPassword"
    ).value = "";

}


logoutButton.addEventListener(
    "click",
    () => {

        if (
            confirm(
                "Deseja realmente sair do sistema?"
            )
        ) {
            logout();
        }

    }
);


/* =========================================================
   NAVEGAÇÃO
========================================================= */

const pageTitles = {

    dashboard: [
        "Dashboard",
        "Visão geral do sistema"
    ],

    vendas: [
        "Vendas",
        "Registre e finalize suas vendas"
    ],

    produtos: [
        "Produtos",
        "Cadastre e gerencie produtos"
    ],

    estoque: [
        "Estoque",
        "Controle entradas, saídas e ajustes"
    ],

    caixa: [
        "Caixa",
        "Controle a movimentação financeira"
    ],

    historico: [
        "Histórico",
        "Consulte as vendas realizadas"
    ],

    relatorios: [
        "Relatórios",
        "Acompanhe os resultados"
    ],

    configuracoes: [
        "Configurações",
        "Dados da loja e preferências"
    ]

};


function navigate(page) {

    currentPage = page;

    document.querySelectorAll(".page")
        .forEach(section => {
            section.classList.remove("active");
        });

    const target =
        document.getElementById(
            `page-${page}`
        );

    if (target) {
        target.classList.add("active");
    }

    document.querySelectorAll(".nav-item[data-page]")
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.page === page
            );

        });

    const title =
        pageTitles[page] ||
        pageTitles.dashboard;

    document.getElementById(
        "topPageTitle"
    ).textContent = title[0];

    document.getElementById(
        "topPageSubtitle"
    ).textContent = title[1];

    closeSidebar();

    updateAll();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


document.querySelectorAll(
    ".nav-item[data-page]"
).forEach(item => {

    item.addEventListener(
        "click",
        () => navigate(item.dataset.page)
    );

});


document.querySelectorAll(
    "[data-go-page]"
).forEach(button => {

    button.addEventListener(
        "click",
        () => navigate(button.dataset.goPage)
    );

});


openSidebarButton.addEventListener(
    "click",
    () => {

        sidebar.classList.add("open");
        sidebarOverlay.classList.add("active");

    }
);


closeSidebarButton.addEventListener(
    "click",
    closeSidebar
);


sidebarOverlay.addEventListener(
    "click",
    closeSidebar
);


function closeSidebar() {

    sidebar.classList.remove("open");

    sidebarOverlay.classList.remove(
        "active"
    );

}


/* =========================================================
   MODAL
========================================================= */

function openModal(title, content) {

    modalTitle.textContent = title;

    modalBody.innerHTML = content;

    modalOverlay.classList.remove(
        "hidden"
    );
}


function closeModal() {

    modalOverlay.classList.add(
        "hidden"
    );

    modalBody.innerHTML = "";
}


closeModalButton.addEventListener(
    "click",
    closeModal
);


modalOverlay.addEventListener(
    "click",
    event => {

        if (event.target === modalOverlay) {
            closeModal();
        }

    }
);


/* =========================================================
   TOAST
========================================================= */

function toast(
    message,
    type = "normal"
) {

    const element =
        document.createElement("div");

    element.className =
        `toast ${type}`;

    element.textContent = message;

    toastContainer.appendChild(element);

    setTimeout(
        () => element.remove(),
        3000
    );
}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    const sales =
        getCompletedSales()
            .filter(isToday);

    const total =
        sales.reduce(
            (sum, sale) =>
                sum + number(sale.total),
            0
        );

    const average =
        sales.length
            ? total / sales.length
            : 0;

    const low =
        lowStockProducts();

    document.getElementById(
        "dashSales"
    ).textContent = money(total);

    document.getElementById(
        "dashOrders"
    ).textContent = sales.length;

    document.getElementById(
        "dashAverage"
    ).textContent = money(average);

    document.getElementById(
        "dashLowStock"
    ).textContent = low.length;


    const recent =
        [...getCompletedSales()]
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            )
            .slice(0, 5);


    const recentContainer =
        document.getElementById(
            "dashboardRecentSales"
        );


    if (!recent.length) {

        recentContainer.innerHTML = `
            <div class="empty">
                <div class="empty-icon">▣</div>
                <strong>Nenhuma venda realizada</strong>
                <span>As vendas aparecerão aqui.</span>
            </div>
        `;

    } else {

        recentContainer.innerHTML =
            recent.map(
                sale => `
                    <div class="report-line">
                        <span>
                            Venda #${sale.id.toString().slice(-6)}
                        </span>

                        <strong>
                            ${money(sale.total)}
                        </strong>
                    </div>
                `
            ).join("");

    }


    const lowContainer =
        document.getElementById(
            "dashboardLowStock"
        );


    if (!low.length) {

        lowContainer.innerHTML = `
            <div class="empty">
                <div class="empty-icon">✓</div>
                <strong>Nenhum alerta</strong>
                <span>Seu estoque está dentro do limite.</span>
            </div>
        `;

    } else {

        lowContainer.innerHTML =
            low.slice(0, 5)
                .map(
                    product => `
                        <div class="report-line">
                            <span>
                                ${escapeHTML(product.name)}
                            </span>

                            <strong style="color:var(--yellow)">
                                ${product.stock}
                            </strong>
                        </div>
                    `
                )
                .join("");

    }

}


/* =========================================================
   PRODUTOS
========================================================= */

document.getElementById(
    "newProductButton"
).addEventListener(
    "click",
    () => productModal()
);


function productModal(productId = null) {

    const product =
        data.products.find(
            item =>
                item.id === productId
        );

    const editing = Boolean(product);

    openModal(
        editing
            ? "Editar produto"
            : "Novo produto",

        `
        <form id="productForm">

            <div class="field">
                <label>Nome</label>
                <input
                    id="productName"
                    type="text"
                    value="${editing ? escapeHTML(product.name) : ""}"
                    placeholder="Nome do produto"
                    required
                >
            </div>

            <div class="field">
                <label>Código</label>
                <input
                    id="productCode"
                    type="text"
                    value="${editing ? escapeHTML(product.code) : ""}"
                    placeholder="Código"
                    required
                >
            </div>

            <div class="field">
                <label>Preço</label>
                <input
                    id="productPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value="${editing ? product.price : ""}"
                    placeholder="0,00"
                    required
                >
            </div>

            <div class="field">
                <label>Estoque</label>
                <input
                    id="productStock"
                    type="number"
                    min="0"
                    step="1"
                    value="${editing ? product.stock : 0}"
                    required
                >
            </div>

            <div class="field">
                <label>Estoque mínimo</label>
                <input
                    id="productMinStock"
                    type="number"
                    min="0"
                    step="1"
                    value="${editing ? product.minStock : 1}"
                    required
                >
            </div>

            <div class="modal-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    id="cancelProduct"
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    class="btn btn-primary"
                >
                    ${editing ? "Salvar" : "Cadastrar"}
                </button>

            </div>

        </form>
        `
    );


    document.getElementById(
        "cancelProduct"
    ).addEventListener(
        "click",
        closeModal
    );


    document.getElementById(
        "productForm"
    ).addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const name =
                document.getElementById(
                    "productName"
                ).value.trim();

            const code =
                document.getElementById(
                    "productCode"
                ).value.trim();

            const price =
                number(
                    document.getElementById(
                        "productPrice"
                    ).value
                );

            const stock =
                Math.max(
                    0,
                    parseInt(
                        document.getElementById(
                            "productStock"
                        ).value
                    ) || 0
                );

            const minStock =
                Math.max(
                    0,
                    parseInt(
                        document.getElementById(
                            "productMinStock"
                        ).value
                    ) || 0
                );


            if (!name || !code || price < 0) {
                return;
            }


            const codeExists =
                data.products.some(
                    item =>
                        item.code === code &&
                        item.id !== productId
                );


            if (codeExists) {

                alert(
                    "Já existe um produto com esse código."
                );

                return;
            }


            if (editing) {

                product.name = name;
                product.code = code;
                product.price = price;
                product.stock = stock;
                product.minStock = minStock;

                toast(
                    "Produto atualizado.",
                    "success"
                );

            } else {

                data.products.push({
                    id: generateId(),
                    name,
                    code,
                    price,
                    stock,
                    minStock
                });

                toast(
                    "Produto cadastrado.",
                    "success"
                );

            }


            saveData();

            closeModal();

            updateAll();

        }
    );

}


function renderProducts() {

    const search =
        document.getElementById(
            "productSearch"
        ).value
            .trim()
            .toLowerCase();


    const products =
        data.products.filter(
            product =>
                product.name
                    .toLowerCase()
                    .includes(search) ||
                product.code
                    .toLowerCase()
                    .includes(search)
        );


    const tbody =
        document.getElementById(
            "productsTable"
        );


    if (!products.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    Nenhum produto encontrado.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        products.map(
            product => {

                const low =
                    product.stock <=
                    product.minStock;

                return `
                    <tr>

                        <td>
                            <strong>
                                ${escapeHTML(product.name)}
                            </strong>
                        </td>

                        <td>
                            ${escapeHTML(product.code)}
                        </td>

                        <td>
                            ${money(product.price)}
                        </td>

                        <td>
                            ${product.stock}
                        </td>

                        <td>
                            ${product.minStock}
                        </td>

                        <td>

                            <button
                                class="table-action"
                                data-edit-product="${product.id}"
                            >
                                Editar
                            </button>

                            <button
                                class="table-action danger"
                                data-delete-product="${product.id}"
                            >
                                Excluir
                            </button>

                        </td>

                    </tr>
                `;

            }
        ).join("");


    tbody.querySelectorAll(
        "[data-edit-product]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () =>
                productModal(
                    Number(
                        button.dataset.editProduct
                    )
                )
        );

    });


    tbody.querySelectorAll(
        "[data-delete-product]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const id =
                    Number(
                        button.dataset.deleteProduct
                    );

                deleteProduct(id);

            }
        );

    });

}


function deleteProduct(id) {

    const product =
        data.products.find(
            item => item.id === id
        );

    if (!product) {
        return;
    }


    if (
        !confirm(
            `Excluir "${product.name}"?`
        )
    ) {
        return;
    }


    data.products =
        data.products.filter(
            item => item.id !== id
        );


    saveData();

    toast(
        "Produto excluído.",
        "success"
    );

    updateAll();

}


document.getElementById(
    "productSearch"
).addEventListener(
    "input",
    renderProducts
);


/* =========================================================
   ESTOQUE
========================================================= */

function renderStock() {

    const totalProducts =
        data.products.length;

    const totalItems =
        data.products.reduce(
            (sum, product) =>
                sum + number(product.stock),
            0
        );

    const low =
        lowStockProducts();


    document.getElementById(
        "stockTotalProducts"
    ).textContent =
        totalProducts;

    document.getElementById(
        "stockTotalItems"
    ).textContent =
        totalItems;

    document.getElementById(
        "stockLowProducts"
    ).textContent =
        low.length;


    const tbody =
        document.getElementById(
            "stockTable"
        );


    tbody.innerHTML =
        data.products.map(
            product => {

                const isLow =
                    product.stock <=
                    product.minStock;

                return `
                    <tr>

                        <td>
                            ${escapeHTML(product.name)}
                        </td>

                        <td>
                            ${escapeHTML(product.code)}
                        </td>

                        <td>
                            ${product.stock}
                        </td>

                        <td>
                            ${product.minStock}
                        </td>

                        <td>
                            ${
                                isLow
                                    ? `<span class="status yellow">Estoque baixo</span>`
                                    : `<span class="status green">Normal</span>`
                            }
                        </td>

                    </tr>
                `;

            }
        ).join("");


    if (!data.products.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    Nenhum produto cadastrado.
                </td>
            </tr>
        `;

    }

}


document.getElementById(
    "stockMovementButton"
).addEventListener(
    "click",
    stockMovementModal
);


function stockMovementModal() {

    if (!data.products.length) {

        alert(
            "Cadastre um produto primeiro."
        );

        navigate("produtos");

        return;
    }


    openModal(
        "Movimentação de estoque",

        `
        <form id="stockMovementForm">

            <div class="field">
                <label>Produto</label>

                <select id="movementProduct">

                    ${data.products.map(
                        product => `
                            <option value="${product.id}">
                                ${escapeHTML(product.name)}
                                — estoque: ${product.stock}
                            </option>
                        `
                    ).join("")}

                </select>
            </div>


            <div class="field">
                <label>Tipo</label>

                <select id="movementType">
                    <option value="in">Entrada</option>
                    <option value="out">Saída</option>
                    <option value="adjust">Ajustar quantidade</option>
                </select>
            </div>


            <div class="field">
                <label>Quantidade</label>

                <input
                    id="movementQuantity"
                    type="number"
                    min="0"
                    step="1"
                    required
                >
            </div>


            <div class="field">
                <label>Observação</label>

                <input
                    id="movementNote"
                    type="text"
                    placeholder="Opcional"
                >
            </div>


            <div class="modal-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    id="cancelMovement"
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    class="btn btn-primary"
                >
                    Confirmar
                </button>

            </div>

        </form>
        `
    );


    document.getElementById(
        "cancelMovement"
    ).addEventListener(
        "click",
        closeModal
    );


    document.getElementById(
        "stockMovementForm"
    ).addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const productId =
                Number(
                    document.getElementById(
                        "movementProduct"
                    ).value
                );

            const type =
                document.getElementById(
                    "movementType"
                ).value;

            const quantity =
                Math.max(
                    0,
                    parseInt(
                        document.getElementById(
                            "movementQuantity"
                        ).value
                    ) || 0
                );

            const note =
                document.getElementById(
                    "movementNote"
                ).value.trim();


            const product =
                data.products.find(
                    item =>
                        item.id === productId
                );


            if (!product || quantity <= 0) {
                return;
            }


            if (
                type === "out" &&
                quantity > product.stock
            ) {

                alert(
                    "Quantidade maior que o estoque disponível."
                );

                return;
            }


            if (type === "in") {
                product.stock += quantity;
            }

            if (type === "out") {
                product.stock -= quantity;
            }

            if (type === "adjust") {
                product.stock = quantity;
            }


            saveData();

            closeModal();

            toast(
                "Estoque atualizado.",
                "success"
            );

            updateAll();

        }
    );

}


/* =========================================================
   VENDAS
========================================================= */

function renderSaleProducts() {

    const search =
        document.getElementById(
            "saleSearch"
        ).value
            .trim()
            .toLowerCase();


    const products =
        data.products.filter(
            product =>
                (
                    product.name
                        .toLowerCase()
                        .includes(search) ||
                    product.code
                        .toLowerCase()
                        .includes(search)
                ) &&
                product.stock > 0
        );


    const container =
        document.getElementById(
            "saleProducts"
        );


    if (!products.length) {

        container.innerHTML = `
            <div class="empty">
                <div class="empty-icon">□</div>
                <strong>Nenhum produto disponível</strong>
                <span>Cadastre produtos ou reponha o estoque.</span>
            </div>
        `;

        return;
    }


    container.innerHTML =
        products.map(
            product => `
                <button
                    type="button"
                    class="product-select-item"
                    data-add-product="${product.id}"
                >

                    <span class="product-select-info">

                        <strong>
                            ${escapeHTML(product.name)}
                        </strong>

                        <small>
                            Código: ${escapeHTML(product.code)}
                            · Estoque: ${product.stock}
                        </small>

                    </span>

                    <span class="product-select-price">
                        ${money(product.price)}
                    </span>

                </button>
            `
        ).join("");


    container.querySelectorAll(
        "[data-add-product]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () => {

                addToCart(
                    Number(
                        button.dataset.addProduct
                    )
                );

            }
        );

    });

}


document.getElementById(
    "saleSearch"
).addEventListener(
    "input",
    renderSaleProducts
);


function addToCart(productId) {

    const product =
        data.products.find(
            item =>
                item.id === productId
        );

    if (!product) {
        return;
    }


    const existing =
        cart.find(
            item =>
                item.productId === productId
        );


    if (existing) {

        if (
            existing.quantity >=
            product.stock
        ) {

            toast(
                "Quantidade máxima disponível.",
                "error"
            );

            return;
        }

        existing.quantity++;

    } else {

        cart.push({
            id: generateId(),
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            type: "product"
        });

    }


    renderCart();

    toast(
        "Produto adicionado.",
        "success"
    );

}


function addOpenItem() {

    openModal(
        "Adicionar item avulso",

        `
        <form id="openItemForm">

            <div class="field">
                <label>Descrição</label>

                <input
                    id="openItemName"
                    type="text"
                    placeholder="Ex.: Serviço"
                    required
                >
            </div>

            <div class="field">
                <label>Preço</label>

                <input
                    id="openItemPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    required
                >
            </div>

            <div class="field">
                <label>Quantidade</label>

                <input
                    id="openItemQuantity"
                    type="number"
                    min="1"
                    step="1"
                    value="1"
                    required
                >
            </div>

            <div class="modal-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    id="cancelOpenItem"
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    class="btn btn-primary"
                >
                    Adicionar
                </button>

            </div>

        </form>
        `
    );


    document.getElementById(
        "cancelOpenItem"
    ).addEventListener(
        "click",
        closeModal
    );


    document.getElementById(
        "openItemForm"
    ).addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const name =
                document.getElementById(
                    "openItemName"
                ).value.trim();

            const price =
                number(
                    document.getElementById(
                        "openItemPrice"
                    ).value
                );

            const quantity =
                Math.max(
                    1,
                    parseInt(
                        document.getElementById(
                            "openItemQuantity"
                        ).value
                    ) || 1
                );


            if (!name || price <= 0) {
                return;
            }


            cart.push({
                id: generateId(),
                productId: null,
                name,
                price,
                quantity,
                type: "open"
            });


            closeModal();

            renderCart();

            toast(
                "Item avulso adicionado.",
                "success"
            );

        }
    );

}


document.getElementById(
    "addOpenItem"
).addEventListener(
    "click",
    addOpenItem
);


function cartSubtotal() {

    return cart.reduce(
        (sum, item) =>
            sum +
            number(item.price) *
            number(item.quantity),
        0
    );

}


function cartDiscount() {

    return Math.max(
        0,
        number(
            document.getElementById(
                "saleDiscount"
            ).value
        )
    );

}


function cartTotal() {

    return Math.max(
        0,
        cartSubtotal() -
        cartDiscount()
    );

}


function renderCart() {

    const container =
        document.getElementById(
            "cartItems"
        );


    const count =
        cart.reduce(
            (sum, item) =>
                sum + item.quantity,
            0
        );


    document.getElementById(
        "cartCount"
    ).textContent =
        `${count} ${count === 1 ? "item" : "itens"}`;


    document.getElementById(
        "cartSubtotal"
    ).textContent =
        money(cartSubtotal());


    document.getElementById(
        "cartTotal"
    ).textContent =
        money(cartTotal());


    if (!cart.length) {

        container.innerHTML = `
            <div class="empty">
                <div class="empty-icon">▣</div>
                <strong>Carrinho vazio</strong>
                <span>Adicione produtos para iniciar uma venda.</span>
            </div>
        `;

        return;
    }


    container.innerHTML =
        cart.map(
            item => `

                <div class="cart-item">

                    <div class="cart-item-top">

                        <div class="cart-item-name">
                            ${escapeHTML(item.name)}
                        </div>

                        <div class="cart-item-price">
                            ${money(
                                item.price *
                                item.quantity
                            )}
                        </div>

                    </div>


                    <div class="cart-item-bottom">

                        <div class="quantity-control">

                            <button
                                type="button"
                                data-cart-minus="${item.id}"
                            >
                                −
                            </button>

                            <span>
                                ${item.quantity}
                            </span>

                            <button
                                type="button"
                                data-cart-plus="${item.id}"
                            >
                                +
                            </button>

                        </div>

                        <button
                            type="button"
                            class="remove-item"
                            data-cart-remove="${item.id}"
                        >
                            Remover
                        </button>

                    </div>

                </div>

            `
        ).join("");


    container.querySelectorAll(
        "[data-cart-minus]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () =>
                changeCartQuantity(
                    Number(
                        button.dataset.cartMinus
                    ),
                    -1
                )
        );

    });


    container.querySelectorAll(
        "[data-cart-plus]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () =>
                changeCartQuantity(
                    Number(
                        button.dataset.cartPlus
                    ),
                    1
                )
        );

    });


    container.querySelectorAll(
        "[data-cart-remove]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () =>
                removeCartItem(
                    Number(
                        button.dataset.cartRemove
                    )
                )
        );

    });

}


function changeCartQuantity(id, change) {

    const item =
        cart.find(
            item =>
                item.id === id
        );

    if (!item) {
        return;
    }


    const newQuantity =
        item.quantity + change;


    if (newQuantity <= 0) {

        removeCartItem(id);

        return;
    }


    if (item.type === "product") {

        const product =
            data.products.find(
                product =>
                    product.id ===
                    item.productId
            );


        if (
            product &&
            newQuantity >
            product.stock
        ) {

            toast(
                "Quantidade maior que o estoque.",
                "error"
            );

            return;
        }

    }


    item.quantity =
        newQuantity;


    renderCart();

}


function removeCartItem(id) {

    cart =
        cart.filter(
            item =>
                item.id !== id
        );

    renderCart();

}


document.getElementById(
    "clearCart"
).addEventListener(
    "click",
    () => {

        if (!cart.length) {
            return;
        }

        if (
            confirm(
                "Limpar todo o carrinho?"
            )
        ) {

            cart = [];

            renderCart();

        }

    }
);


document.getElementById(
    "saleDiscount"
).addEventListener(
    "input",
    renderCart
);


/* =========================================================
   PAGAMENTO
========================================================= */

document.getElementById(
    "openPayment"
).addEventListener(
    "click",
    openPaymentModal
);


function openPaymentModal() {

    if (!cart.length) {

        toast(
            "Adicione pelo menos um item.",
            "error"
        );

        return;
    }


    const total =
        cartTotal();


    openModal(
        "Finalizar pagamento",

        `
        <form id="paymentForm">

            <div class="payment-total">
                <span>Total da venda</span>
                <strong>${money(total)}</strong>
            </div>

            <div class="field">
                <label>Forma de pagamento</label>

                <select id="paymentType">

                    <option value="pix">
                        PIX
                    </option>

                    <option value="cash">
                        Dinheiro
                    </option>

                    <option value="debit">
                        Débito
                    </option>

                    <option value="credit">
                        Crédito
                    </option>

                    <option value="split">
                        Pagamento dividido
                    </option>

                </select>
            </div>


            <div id="paymentFields"></div>


            <div class="modal-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    id="cancelPayment"
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    class="btn btn-primary"
                >
                    Finalizar venda
                </button>

            </div>

        </form>
        `
    );


    const type =
        document.getElementById(
            "paymentType"
        );

    type.addEventListener(
        "change",
        renderPaymentFields
    );


    renderPaymentFields();


    document.getElementById(
        "cancelPayment"
    ).addEventListener(
        "click",
        closeModal
    );


    document.getElementById(
        "paymentForm"
    ).addEventListener(
        "submit",
        event => {

            event.preventDefault();

            finishSale();

        }
    );

}


function renderPaymentFields() {

    const type =
        document.getElementById(
            "paymentType"
        ).value;

    const total =
        cartTotal();

    const container =
        document.getElementById(
            "paymentFields"
        );


    if (type === "cash") {

        container.innerHTML = `

            <div class="field">
                <label>Valor recebido</label>

                <input
                    id="cashReceived"
                    type="number"
                    min="${total}"
                    step="0.01"
                    placeholder="${total.toFixed(2)}"
                    required
                >
            </div>

            <div class="payment-total">
                <span>Troco</span>
                <strong id="cashChange">
                    R$ 0,00
                </strong>
            </div>

        `;


        const received =
            document.getElementById(
                "cashReceived"
            );

        received.addEventListener(
            "input",
            () => {

                const value =
                    number(
                        received.value
                    );

                document.getElementById(
                    "cashChange"
                ).textContent =
                    money(
                        Math.max(
                            0,
                            value - total
                        )
                    );

            }
        );

        return;
    }


    if (type === "split") {

        container.innerHTML = `

            <div class="field">
                <label>Primeira forma</label>

                <select id="splitType1">
                    <option value="pix">PIX</option>
                    <option value="cash">Dinheiro</option>
                    <option value="debit">Débito</option>
                    <option value="credit">Crédito</option>
                </select>
            </div>

            <div class="field">
                <label>Valor primeira forma</label>

                <input
                    id="splitValue1"
                    type="number"
                    min="0"
                    step="0.01"
                    value="${(total / 2).toFixed(2)}"
                    required
                >
            </div>

            <div class="field">
                <label>Segunda forma</label>

                <select id="splitType2">
                    <option value="cash">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="debit">Débito</option>
                    <option value="credit">Crédito</option>
                </select>
            </div>

            <div class="field">
                <label>Valor segunda forma</label>

                <input
                    id="splitValue2"
                    type="number"
                    min="0"
                    step="0.01"
                    value="${(total / 2).toFixed(2)}"
                    required
                >
            </div>

            <div class="payment-total">
                <span>Total informado</span>
                <strong id="splitTotal">
                    ${money(total)}
                </strong>
            </div>

        `;


        const inputs = [
            document.getElementById("splitValue1"),
            document.getElementById("splitValue2")
        ];


        function updateSplit() {

            const sum =
                inputs.reduce(
                    (total, input) =>
                        total +
                        number(input.value),
                    0
                );

            const difference =
                total - sum;

            const element =
                document.getElementById(
                    "splitTotal"
                );


            if (
                Math.abs(difference) < 0.01
            ) {

                element.textContent =
                    "OK — " + money(sum);

                element.style.color =
                    "var(--green)";

            } else {

                element.textContent =
                    money(sum) +
                    ` · Falta ${money(
                        Math.max(
                            0,
                            difference
                        )
                    )}`;

                element.style.color =
                    "var(--yellow)";

            }

        }


        inputs.forEach(
            input =>
                input.addEventListener(
                    "input",
                    updateSplit
                )
        );


        updateSplit();

        return;
    }


    container.innerHTML = `
        <div class="payment-total">
            <span>Valor a pagar</span>
            <strong>${money(total)}</strong>
        </div>
    `;

}


function finishSale() {

    const total =
        cartTotal();

    const type =
        document.getElementById(
            "paymentType"
        ).value;


    if (
        !data.cash.opened
    ) {

        alert(
            "Abra o caixa antes de realizar uma venda."
        );

        return;
    }


    let payments = [];


    if (type === "cash") {

        const received =
            number(
                document.getElementById(
                    "cashReceived"
                ).value
            );


        if (received < total) {

            alert(
                "O valor recebido é menor que o total."
            );

            return;
        }


        payments.push({
            type: "cash",
            value: total,
            received,
            change: received - total
        });

    }


    else if (type === "split") {

        const type1 =
            document.getElementById(
                "splitType1"
            ).value;

        const type2 =
            document.getElementById(
                "splitType2"
            ).value;

        const value1 =
            number(
                document.getElementById(
                    "splitValue1"
                ).value
            );

        const value2 =
            number(
                document.getElementById(
                    "splitValue2"
                ).value
            );


        if (
            Math.abs(
                value1 + value2 - total
            ) > 0.01
        ) {

            alert(
                "Os valores dos pagamentos precisam somar exatamente o total."
            );

            return;
        }


        payments = [
            {
                type: type1,
                value: value1
            },
            {
                type: type2,
                value: value2
            }
        ];

    }


    else {

        payments.push({
            type,
            value: total
        });

    }


    /* ESTOQUE */

    for (const item of cart) {

        if (item.type !== "product") {
            continue;
        }


        const product =
            data.products.find(
                product =>
                    product.id ===
                    item.productId
            );


        if (
            !product ||
            product.stock <
            item.quantity
        ) {

            alert(
                `Estoque insuficiente para ${item.name}.`
            );

            return;
        }

    }


    for (const item of cart) {

        if (item.type !== "product") {
            continue;
        }


        const product =
            data.products.find(
                product =>
                    product.id ===
                    item.productId
            );


        product.stock -=
            item.quantity;

    }


    /* VENDA */

    const sale = {

        id: generateId(),

        date: new Date().toISOString(),

        items: cart.map(
            item => ({
                ...item
            })
        ),

        subtotal: cartSubtotal(),

        discount: cartDiscount(),

        total,

        payments,

        status: "completed",

        userId: currentUser.id

    };


    data.sales.push(sale);


    /* CAIXA */

    payments.forEach(
        payment => {

            data.cash.movements.push({

                id: generateId(),

                date:
                    new Date().toISOString(),

                type: "in",

                value:
                    number(payment.value),

                description:
                    `Venda #${sale.id.toString().slice(-6)} — ${paymentLabel(payment.type)}`,

                saleId:
                    sale.id

            });

        }
    );


    saveData();

    cart = [];

    closeModal();

    renderCart();

    toast(
        "Venda finalizada com sucesso.",
        "success"
    );

    updateAll();

}


function paymentLabel(type) {

    const labels = {
        pix: "PIX",
        cash: "Dinheiro",
        debit: "Débito",
        credit: "Crédito"
    };

    return labels[type] || type;
}


/* =========================================================
   CAIXA
========================================================= */

function renderCash() {

    const balance =
        getCurrentCashBalance();

    const cashIn =
        getCashIn();

    const cashOut =
        getCashOut();


    document.getElementById(
        "cashBalance"
    ).textContent =
        money(balance);

    document.getElementById(
        "cashIn"
    ).textContent =
        money(cashIn);

    document.getElementById(
        "cashOut"
    ).textContent =
        money(cashOut);


    document.getElementById(
        "cashStatus"
    ).textContent =
        data.cash.opened
            ? "Aberto"
            : "Fechado";


    document.getElementById(
        "cashOpenedAt"
    ).textContent =
        data.cash.opened
            ? `Aberto em ${formatDate(data.cash.openedAt)}`
            : "Nenhum caixa aberto";


    document.getElementById(
        "cashStatusIcon"
    ).style.color =
        data.cash.opened
            ? "var(--green)"
            : "var(--muted)";


    const actions =
        document.getElementById(
            "cashActions"
        );


    actions.innerHTML =
        data.cash.opened
            ? `
                <button
                    id="closeCashButton"
                    class="btn btn-secondary"
                >
                    Fechar caixa
                </button>
            `
            : `
                <button
                    id="openCashButton"
                    class="btn btn-primary"
                >
                    Abrir caixa
                </button>
            `;


    if (data.cash.opened) {

        document.getElementById(
            "closeCashButton"
        ).addEventListener(
            "click",
            closeCash
        );

    } else {

        document.getElementById(
            "openCashButton"
        ).addEventListener(
            "click",
            openCashModal
        );

    }


    renderCashTable();

}


function openCashModal() {

    openModal(
        "Abrir caixa",

        `
        <form id="openCashForm">

            <div class="field">
                <label>Valor inicial</label>

                <input
                    id="initialCash"
                    type="number"
                    min="0"
                    step="0.01"
                    value="0"
                    required
                >
            </div>

            <div class="modal-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    id="cancelOpenCash"
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    class="btn btn-primary"
                >
                    Abrir caixa
                </button>

            </div>

        </form>
        `
    );


    document.getElementById(
        "cancelOpenCash"
    ).addEventListener(
        "click",
        closeModal
    );


    document.getElementById(
        "openCashForm"
    ).addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const initial =
                number(
                    document.getElementById(
                        "initialCash"
                    ).value
                );


            data.cash = {

                opened: true,

                initial,

                openedAt:
                    new Date().toISOString(),

                movements: []

            };


            saveData();

            closeModal();

            toast(
                "Caixa aberto.",
                "success"
            );

            updateAll();

        }
    );

}


function closeCash() {

    const balance =
        getCurrentCashBalance();


    if (
        !confirm(
            `Fechar o caixa com saldo de ${money(balance)}?`
        )
    ) {
        return;
    }


    data.cash.opened = false;

    saveData();

    toast(
        "Caixa fechado.",
        "success"
    );

    updateAll();

}


document.getElementById(
    "cashMovementButton"
).addEventListener(
    "click",
    cashMovementModal
);


function cashMovementModal() {

    if (!data.cash.opened) {

        alert(
            "Abra o caixa primeiro."
        );

        return;
    }


    openModal(
        "Entrada / saída de caixa",

        `
        <form id="cashMovementForm">

            <div class="field">
                <label>Tipo</label>

                <select id="cashMovementType">
                    <option value="in">
                        Entrada
                    </option>

                    <option value="out">
                        Saída
                    </option>
                </select>
            </div>

            <div class="field">
                <label>Valor</label>

                <input
                    id="cashMovementValue"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                >
            </div>

            <div class="field">
                <label>Descrição</label>

                <input
                    id="cashMovementDescription"
                    type="text"
                    placeholder="Ex.: retirada"
                    required
                >
            </div>

            <div class="modal-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    id="cancelCashMovement"
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    class="btn btn-primary"
                >
                    Confirmar
                </button>

            </div>

        </form>
        `
    );


    document.getElementById(
        "cancelCashMovement"
    ).addEventListener(
        "click",
        closeModal
    );


    document.getElementById(
        "cashMovementForm"
    ).addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const type =
                document.getElementById(
                    "cashMovementType"
                ).value;

            const value =
                number(
                    document.getElementById(
                        "cashMovementValue"
                    ).value
                );

            const description =
                document.getElementById(
                    "cashMovementDescription"
                ).value.trim();


            if (value <= 0 || !description) {
                return;
            }


            if (
                type === "out" &&
                value >
                getCurrentCashBalance()
            ) {

                alert(
                    "Saldo insuficiente no caixa."
                );

                return;
            }


            data.cash.movements.push({

                id: generateId(),

                date:
                    new Date().toISOString(),

                type,

                value,

                description

            });


            saveData();

            closeModal();

            toast(
                "Movimentação registrada.",
                "success"
            );

            updateAll();

        }
    );

}


function renderCashTable() {

    const tbody =
        document.getElementById(
            "cashTable"
        );


    const movements =
        [...data.cash.movements]
            .reverse();


    if (!movements.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="4">
                    Nenhuma movimentação.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        movements.map(
            movement => `
                <tr>

                    <td>
                        ${formatDate(movement.date)}
                    </td>

                    <td>
                        ${escapeHTML(movement.description)}
                    </td>

                    <td>
                        ${
                            movement.type === "in"
                                ? `<span class="status green">Entrada</span>`
                                : `<span class="status red">Saída</span>`
                        }
                    </td>

                    <td>
                        ${
                            movement.type === "in"
                                ? "+"
                                : "-"
                        }
                        ${money(movement.value)}
                    </td>

                </tr>
            `
        ).join("");

}


/* =========================================================
   HISTÓRICO
========================================================= */

function renderHistory() {

    const search =
        document.getElementById(
            "historySearch"
        ).value
            .trim()
            .toLowerCase();


    const sales =
        [...data.sales]
            .filter(
                sale => {

                    const text =
                        [
                            sale.id,
                            sale.status,
                            sale.total,
                            ...sale.items.map(
                                item => item.name
                            )
                        ]
                            .join(" ")
                            .toLowerCase();

                    return text.includes(search);

                }
            )
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            );


    const tbody =
        document.getElementById(
            "historyTable"
        );


    if (!sales.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    Nenhuma venda encontrada.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        sales.map(
            sale => {

                const payment =
                    sale.payments
                        .map(
                            payment =>
                                paymentLabel(
                                    payment.type
                                )
                        )
                        .join(" + ");


                return `
                    <tr>

                        <td>
                            #${sale.id.toString().slice(-6)}
                        </td>

                        <td>
                            ${formatDate(sale.date)}
                        </td>

                        <td>
                            ${sale.items.reduce(
                                (sum, item) =>
                                    sum + item.quantity,
                                0
                            )}
                        </td>

                        <td>
                            ${escapeHTML(payment)}
                        </td>

                        <td>
                            ${money(sale.total)}
                        </td>

                        <td>
                            ${
                                sale.status === "completed"
                                    ? `<span class="status green">Concluída</span>`
                                    : `<span class="status red">Cancelada</span>`
                            }
                        </td>

                        <td>

                            ${
                                sale.status === "completed"
                                    ? `
                                        <button
                                            class="table-action danger"
                                            data-cancel-sale="${sale.id}"
                                        >
                                            Cancelar
                                        </button>
                                    `
                                    : "—"
                            }

                        </td>

                    </tr>
                `;

            }
        ).join("");


    tbody.querySelectorAll(
        "[data-cancel-sale]"
    ).forEach(button => {

        button.addEventListener(
            "click",
            () =>
                cancelSale(
                    Number(
                        button.dataset.cancelSale
                    )
                )
        );

    });

}


document.getElementById(
    "historySearch"
).addEventListener(
    "input",
    renderHistory
);


function cancelSale(id) {

    const sale =
        data.sales.find(
            item =>
                item.id === id
        );


    if (
        !sale ||
        sale.status !== "completed"
    ) {
        return;
    }


    if (
        !confirm(
            `Cancelar a venda #${id.toString().slice(-6)}? O estoque e o caixa serão corrigidos.`
        )
    ) {
        return;
    }


    /* DEVOLVE ESTOQUE */

    sale.items.forEach(
        item => {

            if (
                item.type !== "product"
            ) {
                return;
            }


            const product =
                data.products.find(
                    product =>
                        product.id ===
                        item.productId
                );


            if (product) {

                product.stock +=
                    item.quantity;

            }

        }
    );


    /* CORRIGE CAIXA */

    const saleMovements =
        data.cash.movements.filter(
            movement =>
                movement.saleId === id
        );


    saleMovements.forEach(
        movement => {

            movement.type = "out";

            movement.description =
                `Estorno venda #${id.toString().slice(-6)} — ${paymentLabelFromMovement(movement.description)}`;

        }
    );


    sale.status = "cancelled";

    sale.cancelledAt =
        new Date().toISOString();

    sale.cancelledBy =
        currentUser.id;


    saveData();

    toast(
        "Venda cancelada e estoque/caixa corrigidos.",
        "success"
    );

    updateAll();

}


function paymentLabelFromMovement(text) {

    if (text.includes("PIX")) {
        return "PIX";
    }

    if (text.includes("Dinheiro")) {
        return "Dinheiro";
    }

    if (text.includes("Débito")) {
        return "Débito";
    }

    if (text.includes("Crédito")) {
        return "Crédito";
    }

    return "pagamento";
}


/* =========================================================
   RELATÓRIOS
========================================================= */

document.querySelectorAll(
    ".report-tab"
).forEach(button => {

    button.addEventListener(
        "click",
        () => {

            document.querySelectorAll(
                ".report-tab"
            ).forEach(
                item =>
                    item.classList.remove(
                        "active"
                    )
            );


            button.classList.add(
                "active"
            );


            reportPeriod =
                button.dataset.period;


            renderReports();

        }
    );

});


function getReportSales() {

    const sales =
        getCompletedSales();


    let start;


    if (reportPeriod === "week") {
        start = getWeekStart();
    }

    else if (
        reportPeriod === "month"
    ) {
        start = getMonthStart();
    }

    else {
        start = todayStart();
    }


    return sales.filter(
        sale =>
            new Date(sale.date) >=
            start
    );

}


function renderReports() {

    const sales =
        getReportSales();


    const total =
        sales.reduce(
            (sum, sale) =>
                sum + number(sale.total),
            0
        );


    const average =
        sales.length
            ? total / sales.length
            : 0;


    document.getElementById(
        "reportSales"
    ).textContent =
        money(total);


    document.getElementById(
        "reportOrders"
    ).textContent =
        sales.length;


    document.getElementById(
        "reportAverage"
    ).textContent =
        money(average);


    const labels = {
        day: "Período de hoje",
        week: "Período da semana",
        month: "Período do mês"
    };


    document.getElementById(
        "reportPeriodLabel"
    ).textContent =
        labels[reportPeriod];


    const productMap = {};


    sales.forEach(
        sale => {

            sale.items.forEach(
                item => {

                    if (
                        !productMap[item.name]
                    ) {
                        productMap[item.name] = 0;
                    }

                    productMap[item.name] +=
                        item.quantity;

                }
            );

        }
    );


    const ranking =
        Object.entries(productMap)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )
            .slice(0, 10);


    const container =
        document.getElementById(
            "reportContent"
        );


    if (!sales.length) {

        container.innerHTML = `
            <div class="empty">
                <div class="empty-icon">▥</div>
                <strong>Nenhuma venda no período</strong>
                <span>Os dados aparecerão quando houver vendas.</span>
            </div>
        `;

        return;
    }


    container.innerHTML = `

        <div class="report-line">
            <span>Total bruto</span>
            <strong>
                ${money(
                    sales.reduce(
                        (sum, sale) =>
                            sum + sale.subtotal,
                        0
                    )
                )}
            </strong>
        </div>

        <div class="report-line">
            <span>Descontos</span>
            <strong>
                ${money(
                    sales.reduce(
                        (sum, sale) =>
                            sum + sale.discount,
                        0
                    )
                )}
            </strong>
        </div>

        <div class="report-line">
            <span>Total líquido</span>
            <strong>
                ${money(total)}
            </strong>
        </div>

        <h3 style="margin-top:25px;font-size:14px;">
            Produtos mais vendidos
        </h3>

        ${
            ranking.length
                ? ranking.map(
                    item => `
                        <div class="report-line">
                            <span>
                                ${escapeHTML(item[0])}
                            </span>

                            <strong>
                                ${item[1]} un.
                            </strong>
                        </div>
                    `
                ).join("")
                : ""
        }

    `;

}


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

function loadSettings() {

    document.getElementById(
        "storeName"
    ).value =
        data.settings.storeName || "";

    document.getElementById(
        "storeDocument"
    ).value =
        data.settings.document || "";

    document.getElementById(
        "storePhone"
    ).value =
        data.settings.phone || "";

}


document.getElementById(
    "storeForm"
).addEventListener(
    "submit",
    event => {

        event.preventDefault();


        data.settings.storeName =
            document.getElementById(
                "storeName"
            ).value.trim();

        data.settings.document =
            document.getElementById(
                "storeDocument"
            ).value.trim();

        data.settings.phone =
            document.getElementById(
                "storePhone"
            ).value.trim();


        saveData();

        toast(
            "Configurações salvas.",
            "success"
        );

    }
);


/* =========================================================
   ATUALIZAÇÃO GERAL
========================================================= */

function updateAll() {

    updateDashboard();

    renderProducts();

    renderStock();

    renderSaleProducts();

    renderCart();

    renderCash();

    renderHistory();

    renderReports();

    loadSettings();

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

function initialize() {

    const loggedId =
        Number(
            sessionStorage.getItem(
                "lmtech_logged"
            )
        );


    if (loggedId) {

        const user =
            data.users.find(
                item =>
                    item.id === loggedId
            );


        if (user) {

            currentUser = user;

            showApp();

            return;
        }

    }


    loginScreen.classList.remove(
        "hidden"
    );

    app.classList.add(
        "hidden"
    );

}


initialize();