document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM fully loaded and parsed');
    initializeEventListeners();
    handleTokenFromUrl();
    loadInitialData();
    initializeStarfield(); // Initialize starfield effect
});

// Initialize all event listeners
function initializeEventListeners() {
    const eventButtonMappings = {
        button1: handleButton1Click,
        button2: handleButton2Click,
        button3: handleButton3Click,
        button4: handleButton4Click,
        button5: handleButton5Click,
        button6: handleButton6Click,
        button7: handleButton7Click,
        button8: handleButton8Click,
        button9: handleButton9Click,
        button10: handleButton10Click
    };

    for (const [buttonId, handler] of Object.entries(eventButtonMappings)) {
        const buttonElement = document.getElementById(buttonId);
        if (buttonElement) {
            buttonElement.addEventListener('click', handler);
        }
    }

    document.getElementById('closeModal')?.addEventListener('click', closeModalWindow);
    window.addEventListener('click', handleWindowClick);
    document.getElementById('copyButton')?.addEventListener('click', handleCopyButtonClick);
    document.getElementById('githubLoginBtn')?.addEventListener('click', handleGithubLogin);
    document.getElementById('googleLoginBtn')?.addEventListener('click', handleGoogleLogin);
}

// Button click handlers
function handleButton1Click() {
    console.log('Button 1 clicked');
    document.getElementById("content").innerHTML = `
        <div class="training-section">
            <h2>REST API Training Site</h2>
            <p>Welcome to our REST API training site! This platform is designed to help you master the basics and advanced concepts of REST APIs using Postman. Whether you are a beginner looking to understand the fundamentals or an experienced developer aiming to sharpen your skills, our site offers a comprehensive range of tutorials, practical exercises, and real-world projects.</p>
            <h3>Get started with Postman in just 3 steps:</h3>
            <div class="step-container">
                <div class="step">
                    <h4>Step 1: Log in and obtain your credentials.</h4>
                    <img src="./Step_1.png" alt="Step 1" class="step-image">
                </div>
                <div class="step">
                    <h4>Step 2: Study the documentation.</h4>
                    <img src="./Step_2.png" alt="Step 2" class="step-image">
                </div>
                <div class="step">
                    <h4>Step 3: Make your first requests and collections in Postman on your own!</h4>
                    <img src="./Step_3.png" alt="Step 3" class="step-image">
                </div>
            </div>
            <p>Dive into the world of RESTful services, learn how to create and test endpoints, and explore the powerful features of Postman to streamline your API development process. Join us on this journey to become proficient in REST API development and take your skills to the next level!</p>
        </div>
    `;
}

function handleButton2Click() {
    console.log('Button 2 clicked');
    loadContent("documentation.html");
}

function handleButton3Click() {
    console.log('Button 3 clicked');
    loadContent("userlist.html", () => {
        loadUsers(1);
        initializeUserPagination();
    });
}

function handleButton4Click() {
    console.log('Button 4 clicked');
    loadContent("order-list.html", () => {
        loadOrders(1);
        initializeOrderPagination();
    }, error => console.error('Ошибка загрузки страницы заказов:', error));
}

function handleButton5Click() {
    console.log('Resources button clicked');
    loadContent("resources.html", null, error => console.error('Ошибка загрузки страницы ресурсов:', error));
}

function handleButton6Click() {
    console.log('Review List button clicked');
    loadContent("review-list.html", () => {
        loadReviews(1);
        initializeReviewPagination();
    });
}

function handleButton7Click() {
    console.log('REST button clicked');
    loadContent("rest.html");
}

function handleButton8Click() {
    console.log('GraphQL button clicked');
    loadContent("graphql.html");
}

function handleButton9Click() {
    console.log('gRPC button clicked');
    loadContent("grpc.html");
}

function handleButton10Click() {
    console.log('WebSocket button clicked');
    loadContent("websocket.html");
}

// Load content from URL into the #content element
function loadContent(url, callback, errorCallback) {
    fetch(url)
        .then(response => response.text())
        .then(data => {
            document.getElementById("content").innerHTML = data;
            if (callback) callback();
        })
        .catch(error => {
            console.error(`Error loading content from ${url}:`, error);
            if (errorCallback) errorCallback(error);
        });
}

// Modal functionality
function openModal(token) {
    console.log('Opening modal with token');
    document.getElementById('jwtToken').textContent = token;
    document.getElementById('tokenModal').style.display = 'block';
}

function closeModalWindow() {
    console.log('Closing modal');
    document.getElementById('tokenModal').style.display = 'none';
}

function handleWindowClick(event) {
    if (event.target === document.getElementById('tokenModal')) {
        closeModalWindow();
    }
}

function handleCopyButtonClick() {
    console.log('Copy button clicked');
    navigator.clipboard.writeText(document.getElementById('jwtToken').textContent)
        .then(() => alert('Token copied to clipboard'))
        .catch(err => console.error('Could not copy text: ', err));
}

// OAuth login handlers
function handleGithubLogin() {
    console.log('GitHub login button clicked');
    window.location.href = 'https://github.com/login/oauth/authorize?client_id=Ov23liUm9zDqtXxfqLwa&scope=user&redirect_uri=https://alexqa.netlify.app/.netlify/functions/github-callback';
}

function handleGoogleLogin() {
    console.log('Google login button clicked');
    window.location.href = 'https://accounts.google.com/o/oauth2/auth?client_id=249425105169-8gfnkub71sjsr9d6jei87294h96o2n7i.apps.googleusercontent.com&redirect_uri=https://alexqa.netlify.app/.netlify/functions/google-callback&scope=profile email&response_type=code';
}

// Handle the JWT token if present in URL
function handleTokenFromUrl() {
    console.log('Checking for JWT token in URL');
    if (!sessionStorage.getItem('tokenChecked')) {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            openModal(token);
            localStorage.setItem('jwtToken', token); // Save token to localStorage
            sessionStorage.setItem('tokenChecked', 'true');
        }
    }
}

// Load initial data on page load
function loadInitialData() {
    window.addEventListener('load', function() {
        const savedUserPage = parseInt(localStorage.getItem('currentPage')) || 1;
        console.log(`Window loaded. Saved user page: ${savedUserPage}`);
        loadUsers(savedUserPage);

        const savedOrderPage = parseInt(localStorage.getItem('currentOrderPage')) || 1;
        console.log(`Window loaded. Saved order page: ${savedOrderPage}`);
        loadOrders(savedOrderPage);
    });
}

// Fetch user list data
function fetchUsers(page, itemsPerPage) {
    const token = localStorage.getItem('jwtToken'); // Get the token from localStorage

    if (!token) {
        console.error('No token found');
        return;
    }

    const userListContainer = document.getElementById('userListContainer');
    console.log(`Fetching users for page ${page} with limit ${itemsPerPage}`);

    fetch(`https://alexqa.netlify.app/.netlify/functions/getUsers?page=${page}&limit=${itemsPerPage}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Fetched users:', data);
        const users = data.users || [];
        const totalPages = data.totalPages || 1;
        userListContainer.innerHTML = '';

        if (users.length > 0) {
            const userList = document.createElement('ul');
            users.forEach(user => {
                const userItem = document.createElement('li');
                const creationDate = new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                userItem.textContent = `${user.name} (${user.email}) - Phone: ${user.phoneNumber || 'N/A'} - Created At: ${creationDate}`;
                userList.appendChild(userItem);
            });
            userListContainer.appendChild(userList);
        } else {
            userListContainer.innerHTML = '<p>No users found.</p>';
        }

        updatePagination('user', page, totalPages);
    })
    .catch(error => {
        console.error('Error fetching user list:', error);
        userListContainer.innerHTML += '<p>Failed to load users.</p>';
    });
}

// Load users for a specific page
function loadUsers(page) {
    console.log(`Loading users for page ${page}`);
    const itemsPerPage = 10;
    fetchUsers(page, itemsPerPage);
}

// Initialize user pagination event listeners
function initializeUserPagination() {
    const paginationButtonMappings = {
        prevPage: () => navigateToPage('user', -1),
        nextPage: () => navigateToPage('user', 1)
    };

    for (const [buttonId, handler] of Object.entries(paginationButtonMappings)) {
        document.getElementById(buttonId).addEventListener('click', handler);
    }
}

// Fetch order list data
function fetchOrders(page, itemsPerPage) {
    const token = localStorage.getItem('jwtToken'); // Get the token from localStorage

    if (!token) {
        console.error('No token found');
        return;
    }

    const orderListContainer = document.getElementById('orderListContainer');
    console.log(`Fetching orders for page ${page} with limit ${itemsPerPage}`);

    fetch(`https://alexqa.netlify.app/.netlify/functions/getOrders?page=${page}&limit=${itemsPerPage}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Fetched orders:', data);
        const orders = data.orders || [];
        const totalPages = data.totalPages || 1;
        orderListContainer.innerHTML = '';

        if (orders.length > 0) {
            const orderList = document.createElement('ul');
            orders.forEach(order => {
                console.log('Order item:', order);
                const orderItem = document.createElement('li');
                const creationDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                orderItem.textContent = `Order #${order._id}: Total Amount: ${order.totalAmount}, Created At: ${creationDate}`;
                orderList.appendChild(orderItem);
            });
            orderListContainer.appendChild(orderList);
        } else {
            orderListContainer.innerHTML = '<p>No orders found.</p>';
        }

        updatePagination('order', page, totalPages);
    })
    .catch(error => {
        console.error('Error fetching order list:', error);
        orderListContainer.innerHTML += '<p>Failed to load orders.</p>';
    });
}

// Load orders for a specific page
function loadOrders(page) {
    console.log(`Loading orders for page ${page}`);
    const itemsPerPage = 10;
    fetchOrders(page, itemsPerPage);
}

// Initialize order pagination event listeners
function initializeOrderPagination() {
    const paginationButtonMappings = {
        prevOrderPage: () => navigateToPage('order', -1),
        nextOrderPage: () => navigateToPage('order', 1)
    };

    for (const [buttonId, handler] of Object.entries(paginationButtonMappings)) {
        document.getElementById(buttonId).addEventListener('click', handler);
    }
}

// Fetch review list data
function fetchReviews(page, itemsPerPage) {
    const token = localStorage.getItem('jwtToken'); // Get the token from localStorage

    if (!token) {
        console.error('No token found');
        return;
    }

    const reviewListContainer = document.getElementById('reviewListContainer');
    console.log(`Fetching reviews for page ${page} with limit ${itemsPerPage}`);

    fetch(`https://alexqa.netlify.app/.netlify/functions/getReviews?page=${page}&limit=${itemsPerPage}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Fetched reviews:', data);
        const reviews = data.reviews || [];
        const totalPages = data.totalPages || 1;
        reviewListContainer.innerHTML = '';

        if (reviews.length > 0) {
            const reviewList = document.createElement('ul');
            reviews.forEach(review => {
                const reviewItem = document.createElement('li');
                const creationDate = new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                const creationTime = new Date(review.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                reviewItem.textContent = `Product ID: ${review.orderId || 'N/A'} - User ID: ${review.createdBy || 'N/A'} - Comment: ${review.comment} (Rating: ${review.rating}) - Created At: ${creationDate} ${creationTime}`;
                reviewList.appendChild(reviewItem);
            });
            reviewListContainer.appendChild(reviewList);
        } else {
            reviewListContainer.innerHTML = '<p>No reviews found.</p>';
        }

        updatePagination('review', page, totalPages);
    })
    .catch(error => {
        console.error('Error fetching review list:', error);
        reviewListContainer.innerHTML += '<p>Failed to load reviews.</p>';
    });
}

// Load reviews for a specific page
function loadReviews(page) {
    console.log(`Loading reviews for page ${page}`);
    const itemsPerPage = 10;
    fetchReviews(page, itemsPerPage);
}

// Initialize review pagination event listeners
function initializeReviewPagination() {
    const paginationButtonMappings = {
        prevReviewPage: () => navigateToPage('review', -1),
        nextReviewPage: () => navigateToPage('review', 1)
    };

    for (const [buttonId, handler] of Object.entries(paginationButtonMappings)) {
        document.getElementById(buttonId).addEventListener('click', handler);
    }
}

// Navigate to a specific page in user, order, or review pagination
function navigateToPage(type, direction) {
    const currentPageKey = type === 'user' ? 'currentPage' :
                            type === 'order' ? 'currentOrderPage' :
                            'currentReviewPage';
    const currentPage = parseInt(localStorage.getItem(currentPageKey)) || 1;
    console.log(`Navigating to ${type} page. Current page: ${currentPage}`);
    
    const newPage = currentPage + direction;
    if (newPage < 1) return;

    if (type === 'user') {
        loadUsers(newPage);
    } else if (type === 'order') {
        loadOrders(newPage);
    } else if (type === 'review') {
        loadReviews(newPage);
    }
    localStorage.setItem(currentPageKey, newPage);
    console.log(`Navigated to ${type} page: ${newPage}`);
}

// Update pagination info
function updatePagination(type, page, totalPages) {
    const pageInfoId = type === 'user' ? 'pageInfo' :
                       type === 'order' ? 'orderPageInfo' :
                       'reviewPageInfo';
    const prevPageButtonId = type === 'user' ? 'prevPage' :
                             type === 'order' ? 'prevOrderPage' :
                             'prevReviewPage';
    const nextPageButtonId = type === 'user' ? 'nextPage' :
                             type === 'order' ? 'nextOrderPage' :
                             'nextReviewPage';

    document.getElementById(pageInfoId).textContent = `Page ${page} of ${totalPages}`;
    document.getElementById(prevPageButtonId).disabled = page === 1;
    document.getElementById(nextPageButtonId).disabled = page === totalPages;

    console.log(`Updated ${type} pagination: Page ${page} of ${totalPages}`);
}


// Initialize starfield effect
function initializeStarfield() {
    const starfield = document.createElement('div');
    starfield.id = 'starfield';
    document.body.appendChild(starfield);

    const numberOfStars = 150; // Adjust this number if needed
    for (let i = 0; i < numberOfStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';

        // Reduced size range by 70%
        const size = Math.random() * 1.8 + 1.8; // Size between 1.8px and 3px
        const positionX = Math.random() * 100 + 'vw';
        const positionY = Math.random() * 100 + 'vh';
        const depth = Math.random() * -1000 - 500;

        // Random shape
        const shapes = ['50%', '40% 60%', '50% 50% 50% 50% / 60% 40% 60% 40%']; // Circle, oval, and semi-circle
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];

        // Apply random size and shape
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.borderRadius = randomShape;

        // Random position within the viewport
        star.style.left = positionX;
        star.style.top = positionY;

        // Apply initial random depth
        star.style.transform = `translateZ(${depth}px)`;

        // Apply random animation duration for different speeds
        star.style.animation = `moveStars ${Math.random() * 5 + 5}s infinite linear`; // Speed increased by halving the time

        // Append the star to the starfield
        starfield.appendChild(star);
    }
}

// Call the function to initialize the starfield
initializeStarfield();
