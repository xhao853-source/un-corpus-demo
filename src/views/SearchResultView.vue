<template>
  <div class="search-result">
    <!-- 顶部搜索栏 -->
    <header class="result-header">
      <div class="header-left">
        <el-button @click="goBack" text>
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <span class="search-info">
          "{{ keyword }}" 的搜索结果（{{ results.length }}条）
        </span>
      </div>
      <div class="header-right">
        <el-input
          v-model="newKeyword"
          placeholder="重新搜索"
          size="small"
          style="width: 200px"
          @keyup.enter="reSearch"
        >
          <template #suffix>
            <el-icon @click="reSearch" class="search-icon"><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </header>

    <!-- 结果列表 -->
    <div class="result-list">
      <div
        v-for="item in results"
        :key="item.id"
        class="result-card"
      >
        <div class="card-header">
          <div class="header-left">
            <el-tag size="small" type="info">{{ item.theme_zh }}</el-tag>
            <el-button
              text
              circle
              :type="favoritesStore.isFavorite(item.id) ? 'danger' : ''"
              @click.stop="favoritesStore.toggleFavorite(item)"
            >
              <el-icon>
                <Star v-if="!favoritesStore.isFavorite(item.id)" />
                <StarFilled v-else />
              </el-icon>
            </el-button>
          </div>
          <span class="source">{{ item.source }}</span>
        </div>
        
        <!-- 智能布局：搜索语言在左 -->
        <div class="bilingual-content" :class="{ 'zh-left': isZhSearch }">
          <!-- 左侧：搜索语言 -->
          <div class="primary-text" v-html="highlightText(getPrimaryText(item), keyword)"></div>
          
          <div class="divider"></div>
          
          <!-- 右侧：翻译语言 -->
          <div class="secondary-text" v-html="getSecondaryText(item)"></div>
        </div>
      </div>
    </div>

    <!-- 无结果提示 -->
    <el-empty v-if="results.length === 0" description="未找到相关语料，建议尝试其他关键词" />

    <!-- 底部导航 -->
    <nav class="bottom-nav">
      <div class="nav-item" @click="goHome">
        <el-icon><Search /></el-icon>
        <span>搜索</span>
      </div>
      <div class="nav-item" @click="goTerms">
        <el-icon><Collection /></el-icon>
        <span>术语库</span>
      </div>
      <div class="nav-item" @click="goUser">
        <el-icon><User /></el-icon>
        <span>我的</span>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, Collection, User, ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import corpusData from '../data/corpus.json'
import { useFavoritesStore } from '../stores/favorites'
import { Star, StarFilled } from '@element-plus/icons-vue'

const favoritesStore = useFavoritesStore()

const route = useRoute()
const router = useRouter()

const keyword = ref('')
const newKeyword = ref('')
const results = ref([])
const selectedThemes = ref(['all'])

// 判断搜索语言：包含中文字符则为中文搜索
const isZhSearch = computed(() => {
  if (!keyword.value) return false
  return /[\u4e00-\u9fa5]/.test(keyword.value)
})

// 恢复搜索状态的函数
const restoreSearchState = () => {
  const savedKeyword = sessionStorage.getItem('searchKeyword')
  const savedResults = sessionStorage.getItem('searchResults')
  const savedThemes = sessionStorage.getItem('searchThemes')
  
  if (savedKeyword && savedResults) {
    keyword.value = savedKeyword
    results.value = JSON.parse(savedResults)
    selectedThemes.value = savedThemes ? savedThemes.split(',') : ['all']
    console.log('恢复搜索结果:', results.value.length, '条')
    return true
  }
  return false
}

// 页面加载时恢复状态
onMounted(() => {
  // 优先从 URL 参数获取（适用于直接访问或分享链接）
  const urlKeyword = route.query.q
  const urlThemes = route.query.themes ? route.query.themes.split(',') : ['all']
  
  if (urlKeyword) {
    // URL 有参数，执行搜索
    keyword.value = urlKeyword
    selectedThemes.value = urlThemes
    performSearch(keyword.value, selectedThemes.value)
  } else {
    // URL 无参数，尝试从 sessionStorage 恢复
    restoreSearchState()
  }
})

// 监听路由变化，确保从其他页面返回时恢复状态
watch(() => route.path, () => {
  const urlKeyword = route.query.q
  if (urlKeyword) {
    // 如果 URL 有参数，同步状态
    keyword.value = urlKeyword
    const urlThemes = route.query.themes ? route.query.themes.split(',') : ['all']
    selectedThemes.value = urlThemes
    performSearch(keyword.value, selectedThemes.value)
  } else {
    // 否则从 sessionStorage 恢复
    restoreSearchState()
  }
})

const performSearch = (query, themes) => {
  const lowerQuery = query.toLowerCase()
  
  results.value = corpusData.data.filter(item => {
    if (!themes.includes('all') && !themes.includes(item.theme)) {
      return false
    }
    
    const matchZh = item.zh.includes(query)
    const matchEn = item.en.toLowerCase().includes(lowerQuery)
    
    return matchZh || matchEn
  })
  
  // 保存到 sessionStorage
  sessionStorage.setItem('searchKeyword', query)
  sessionStorage.setItem('searchResults', JSON.stringify(results.value))
  sessionStorage.setItem('searchThemes', themes.join(','))
  
  console.log(`搜索"${query}"，找到${results.value.length}条结果`)
}

// 获取主文本（搜索语言）
const getPrimaryText = (item) => {
  return isZhSearch.value ? item.zh : item.en
}

// 获取次文本（翻译语言）
const getSecondaryText = (item) => {
  return isZhSearch.value ? item.en : item.zh
}

// 高亮关键词
const highlightText = (text, query) => {
  if (!query) return text
  
  // 中文搜索：直接匹配
  if (isZhSearch.value) {
    const regex = new RegExp(`(${query})`, 'g')
    return text.replace(regex, '<mark>$1</mark>')
  }
  
  // 英文搜索：不区分大小写
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

const reSearch = () => {
  if (newKeyword.value.trim()) {
    const themes = route.query.themes ? route.query.themes.split(',') : ['all']
    
    // 直接更新组件状态，立即显示新结果
    keyword.value = newKeyword.value
    performSearch(keyword.value, themes)
    
    // 同时更新 URL（用于分享和书签）
    router.replace({
      path: '/search',
      query: {
        q: keyword.value,
        themes: route.query.themes || 'all'
      }
    })
    
    newKeyword.value = ''
  }
}

const goDetail = (id) => {
  alert(`即将进入语料详情页: ${id}\n（下一页实现）`)
}

const goBack = () => router.push('/')
const goHome = () => router.push('/')
const goTerms = () => router.push('/terms')
const goUser = () => router.push('/user')
</script>

<style scoped>
.search-result {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.result-header {
  background: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.search-info {
  color: #333;
  font-size: 16px;
  font-weight: 500;
}

.search-icon {
  cursor: pointer;
  color: #5B92E5;
}

.result-list {
  max-width: 900px;
  margin: 20px auto;
  padding: 0 15px;
}

.result-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.source {
  color: #999;
  font-size: 13px;
}

.bilingual-content {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 20px;
  align-items: start;
}

/* 中文搜索时：中文在左（默认） */
.primary-text {
  color: #333;
  font-size: 15px;
  line-height: 1.6;
  font-weight: 500;
}

.secondary-text {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  font-style: italic;
}

.divider {
  width: 1px;
  background: #e0e0e0;
  min-height: 40px;
}

:deep(mark) {
  background: #fff3cd;
  color: #856404;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 600;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: white;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #999;
  font-size: 12px;
  transition: all 0.3s;
  padding: 8px 20px;
}

.nav-item:hover {
  color: #5B92E5;
}

.nav-item .el-icon {
  font-size: 22px;
}

@media (max-width: 768px) {
  .bilingual-content {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .divider {
    display: none;
  }
  
  .result-header {
    flex-direction: column;
    gap: 10px;
  }
}
</style>