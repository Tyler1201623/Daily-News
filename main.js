let currentCategory = 'general';

const API_CONFIG = {
    newsapi: {
        key: '159fd6b862ae4251999890aca2260530',
        baseUrl: 'https://newsapi.org/v2'
    },
    newsdata: {
        key: 'pub_616813dac3d0265beeeceb7876aaa6f05903f',
        baseUrl: 'https://newsdata.io/api/1'
    }
};

const newsCache = {
    data: new Map(),
    set(category, data, timestamp = Date.now()) {
        this.data.set(category, { data, timestamp });
    },
    get(category) {
        const cached = this.data.get(category);
        if (!cached) return null;
        if (Date.now() - cached.timestamp > 900000) return null;
        return cached.data;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    loadNews(currentCategory);
    setupEventListeners();
});

function setupEventListeners() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentCategory = button.dataset.category;
            loadNews(currentCategory);
        });
    });

    // Dark mode toggle functionality
    const darkModeToggle = document.getElementById('darkModeToggle');
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        darkModeToggle.classList.toggle('active');
        const icon = darkModeToggle.querySelector('i');
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
    });
}
async function loadNews(category) {
    showLoader();
    const pageSize = window.innerWidth >= 1200 ? 100 : 
                     window.innerWidth >= 768 ? 50 : 25;
    
    try {
        const response = await fetch(
            `https://newsapi.org/v2/top-headlines?category=${category}&language=en&apiKey=${API_CONFIG.newsapi.key}&pageSize=${pageSize}`,
            {
                headers: {
                    'Authorization': API_CONFIG.newsapi.key
                }
            }
        );
        const data = await response.json();
        
        if (data.articles && data.articles.length > 0) {
            processAndDisplayNews(data.articles);
        }
    } catch (error) {
        console.error('Error loading news:', error);
        displaySampleNews(category);
    } finally {
        hideLoader();
    }
}

function processAndDisplayNews(articles) {
    const validArticles = articles.filter(article => 
        article?.title &&
        article?.description &&
        !article.title.includes('[Removed]') &&
        !article.description.includes('[Removed]')
    );
    
    newsCache.set(currentCategory, validArticles);
    displayNews(validArticles);
}

function displayNews(articles) {
    if (!articles?.length) return;
    
    const featuredNews = document.getElementById('featuredNews');
    const latestNews = document.getElementById('latestNews');
    
    const featuredCount = Math.max(3, Math.floor(articles.length * 0.25));
    
    featuredNews.innerHTML = articles
        .slice(0, featuredCount)
        .map(article => createNewsCard(article, true))
        .join('');
        
    latestNews.innerHTML = articles
        .slice(featuredCount)
        .map(article => createNewsCard(article, false))
        .join('');
}

function createNewsCard(article, isFeatured) {
    const categoryImages = {
        technology: 'https://source.unsplash.com/800x400/?technology',
        business: 'https://source.unsplash.com/800x400/?business',
        health: 'https://source.unsplash.com/800x400/?health',
        general: 'https://source.unsplash.com/800x400/?news'
    };

    const fallbackImage = categoryImages[currentCategory] || categoryImages.general;
    
    return `
        <div class="news-card ${isFeatured ? 'featured' : ''}" data-article='${JSON.stringify(article)}'>
            <img class="news-image" 
                 src="${article.urlToImage || fallbackImage}" 
                 alt="${article.title}"
                 loading="lazy"
                 onerror="this.src='${fallbackImage}'">
            <div class="news-content">
                <h3 class="news-title">${article.title}</h3>
                <p class="news-description">${article.description || 'No description available'}</p>
                <div class="news-meta">
                    <span>${article.source?.name || 'Unknown Source'}</span>
                    <span>${new Date(article.publishedAt).toLocaleDateString()}</span>
                </div>
                <button class="read-more-btn" onclick="showFullArticle(this)">
                    Read Full Article
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;
}

function showFullArticle(button) {
    const article = JSON.parse(button.closest('.news-card').dataset.article);
    const modal = document.createElement('div');
    modal.className = 'article-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>${article.title}</h2>
            <img src="${article.urlToImage}" alt="${article.title}" style="width: 100%; margin: 1rem 0;">
            <p>${article.description}</p>
            <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="primary-btn">
                Read Original Article
            </a>
        </div>
    `;
    
    document.body.appendChild(modal);
    requestAnimationFrame(() => {
        modal.classList.add('active');
        modal.querySelector('.modal-content').classList.add('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    });
}

function showLoader() {
    document.querySelector('.loading-spinner').style.display = 'flex';
}

function hideLoader() {
    document.querySelector('.loading-spinner').style.display = 'none';
}

function displaySampleNews(category) {
    const sampleNews = [
        {
            title: "Loading latest news...",
            description: "Please wait while we fetch the latest stories for you.",
            url: "#",
            urlToImage: `https://source.unsplash.com/800x400/?${category}`,
            source: { name: "Daily Pulse" },
            publishedAt: new Date().toISOString()
        },
        {
            title: "Fetching trending stories...",
            description: "Getting the most relevant news for your interests.",
            url: "#",
            urlToImage: `https://source.unsplash.com/800x400/?${category}-2`,
            source: { name: "Daily Pulse" },
            publishedAt: new Date().toISOString()
        },
        {
            title: "Updating news feed...",
            description: "Connecting to news sources around the world.",
            url: "#",
            urlToImage: `https://source.unsplash.com/800x400/?${category}-3`,
            source: { name: "Daily Pulse" },
            publishedAt: new Date().toISOString()
        }
    ];
    
    displayNews(sampleNews);
}
