// --- PARENT CONTROLLER STATE ---
const LibraryState = {
    books: [
        { id: 1, name: "The Great Gatsby" },
        { id: 2, name: "To Kill a Mockingbird" },
        { id: 3, name: "1984" }
    ],
    searchQuery: ""
};

// --- DOM ELEMENTS REFERENCE ---
const totalBooksSpan = document.getElementById('total-books');
const parentSearchInput = document.getElementById('parent-search-input');
const searchPreview = document.getElementById('search-preview');
const bookForm = document.getElementById('book-form');
const childTitleInput = document.getElementById('child-title-input');
const bookListContainer = document.getElementById('book-list-container');

// --- PARENT CONTROLLER LOGIC ---
function ParentController() {
    updateTotalCount();
    ChildListController();
}

function updateTotalCount() {
    totalBooksSpan.textContent = LibraryState.books.length;
}

// --- TWO-WAY BINDING: Parent Search Listener ---
parentSearchInput.addEventListener('input', (e) => {
    // 1. Update state from UI (View -> Model)
    LibraryState.searchQuery = e.target.value;
    
    // 2. Update preview bound text (Model -> View)
    searchPreview.textContent = LibraryState.searchQuery;

    // 3. Trigger child list re-render based on new search state
    ChildListController();
});


// --- CHILD CONTROLLER 1: Form Controller (Handles Adding Books) ---
bookForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const bookName = childTitleInput.value.trim();

    if (bookName) {
        // Update State Model
        const newBook = {
            id: Date.now(),
            name: bookName
        };
        LibraryState.books.push(newBook);

        // Reset child form input
        childTitleInput.value = '';

        // Refresh Parent & Child views
        ParentController();
    }
});


// --- CHILD CONTROLLER 2: Book List Controller (Renders multiple books) ---
function ChildListController() {
    bookListContainer.innerHTML = '';

    // Filter books based on Parent Controller's two-way bound search query
    const filteredBooks = LibraryState.books.filter(book => 
        book.name.toLowerCase().includes(LibraryState.searchQuery.toLowerCase())
    );

    if (filteredBooks.length === 0) {
        bookListContainer.innerHTML = '<p style="color: #888;">No books found.</p>';
        return;
    }

    // Render elements using div tags
    filteredBooks.forEach(book => {
        const bookDiv = document.createElement('div');
        bookDiv.className = 'book-item';
        
        bookDiv.innerHTML = `
            <span>📖 ${escapeHTML(book.name)}</span>
            <button onclick="deleteBook(${book.id})" style="background: #e74c3c; color: white; border: none; padding: 4px 8px; cursor: pointer; border-radius: 3px;">Delete</button>
        `;
        
        bookListContainer.appendChild(bookDiv);
    });
}

// Global scope action for deleting a book item
window.deleteBook = function(id) {
    LibraryState.books = LibraryState.books.filter(book => book.id !== id);
    ParentController(); // Refresh layout
};

// Security helper to prevent injection
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Initialize Application on Load
ParentController();