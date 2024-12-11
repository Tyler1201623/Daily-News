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

let currentCategory = 'general';

document.addEventListener('DOMContentLoaded', () => {
    loadNews(currentCategory);
    setupEventListeners();
});

function setupEventListeners() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentCategory = button.dataset.category;
            loadNews(currentCategory);
        });
    });

    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) searchNews(query);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) searchNews(query);
        }
    });

    const darkModeToggle = document.getElementById('darkModeToggle');
    darkModeToggle.addEventListener('click', toggleDarkMode);
    
    // Check user preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.documentElement.classList.add('dark-mode');
        darkModeToggle.classList.add('active');
    }
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark-mode');
    const isDark = document.documentElement.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    document.getElementById('darkModeToggle').classList.toggle('active');
}
const CACHE_CONFIG = {
    SHORT: 900000
};

const newsCache = {
    data: new Map(),
    set(category, data) {
        this.data.set(category, {
            data: data,
            timestamp: Date.now()
        });
    },
    get(category) {
        return this.data.get(category)?.data;
    }
};

async function loadNews(category) {
    showLoader();
    
    const cachedNews = newsCache.get(category);
    if (cachedNews) {
        displayNews(cachedNews);
        hideLoader();
        return;
    }

    displaySampleNews(category);

    try {
        const newsApiResponse = await fetch(
            `${API_CONFIG.newsapi.baseUrl}/top-headlines?category=${category}&language=en&apiKey=${API_CONFIG.newsapi.key}&pageSize=100`
        );
        
        if (newsApiResponse.status === 429) {
            const newsDataResponse = await fetch(
                `${API_CONFIG.newsdata.baseUrl}/news?category=${category}&language=en&apikey=${API_CONFIG.newsdata.key}&size=100`
            );
            const newsDataResults = await newsDataResponse.json();
            
            if (newsDataResults.status === 'success') {
                const articles = newsDataResults.results.map(article => ({
                    title: article.title,
                    description: article.description,
                    url: article.link,
                    urlToImage: article.image_url,
                    source: { name: article.source_id },
                    publishedAt: article.pubDate
                }));
                
                newsCache.set(category, articles);
                displayNews(articles);
            }
        } else {
            const data = await newsApiResponse.json();
            if (data.articles && data.articles.length > 0) {
                newsCache.set(category, data.articles);
                displayNews(data.articles);
            }
        }
    } catch (error) {
        console.log('Using sample news while APIs refresh');
    } finally {
        hideLoader();
    }
}

function displayNews(articles) {
    const validArticles = articles.filter(article => 
        article.title !== "removed" && 
        article.description !== "removed" &&
        article.title !== "[Removed]" &&
        article.description !== "[Removed]"
    );
    
    const featuredNews = document.getElementById('featuredNews');
    const latestNews = document.getElementById('latestNews');
    
    featuredNews.innerHTML = validArticles.slice(0, 3).map(article => createNewsCard(article, true)).join('');
    latestNews.innerHTML = validArticles.slice(3).map(article => createNewsCard(article, false)).join('');
}

function createNewsCard(article, isFeatured) {
    const categoryImages = {
        technology: 'https://picsum.photos/800/400?tech',
        business: 'https://picsum.photos/800/400?business',
        health: 'https://picsum.photos/800/400?health',
        general: 'https://picsum.photos/800/400?news'
    };

    const fallbackImage = categoryImages[currentCategory] || categoryImages.general;
    
    return `
        <div class="news-card ${isFeatured ? 'featured' : ''}" data-article='${JSON.stringify(article)}'>
            <img class="news-image" 
                 src="${article.urlToImage || fallbackImage + '?' + Date.now()}" 
                 alt="${article.title}" 
                 loading="lazy"
                 onerror="this.src='${fallbackImage + '?' + Date.now()}'">
            <div class="news-content">
                <h3 class="news-title">${article.title}</h3>
                <p class="news-description">${article.description || 'No description available'}</p>
                <div class="news-meta">
                    <span>${article.source.name}</span>
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
            urlToImage: `https://picsum.photos/800/400?${category}`,
            source: { name: "Daily Pulse" },
            publishedAt: new Date().toISOString()
        },
        {
            title: "Fetching trending stories...",
            description: "Getting the most relevant news for your interests.",
            url: "#",
            urlToImage: `https://picsum.photos/800/400?${category}-2`,
            source: { name: "Daily Pulse" },
            publishedAt: new Date().toISOString()
        },
        {
            title: "Updating news feed...",
            description: "Connecting to news sources around the world.",
            url: "#",
            urlToImage: `https://picsum.photos/800/400?${category}-3`,
            source: { name: "Daily Pulse" },
            publishedAt: new Date().toISOString()
        }
    ];
    
    displayNews(sampleNews);
}