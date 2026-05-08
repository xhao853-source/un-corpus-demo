<template>
  <div class="term-bank">
    <header class="page-header">
      <el-button @click="goBack" text>
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1>📚 术语库</h1>
    </header>

    <!-- 主题筛选 -->
    <div class="theme-tabs">
      <el-tag
        v-for="theme in themes"
        :key="theme.value"
        :type="currentTheme === theme.value ? 'primary' : 'info'"
        class="theme-tab"
        @click="currentTheme = theme.value"
      >
        {{ theme.label }}
      </el-tag>
    </div>

    <!-- 术语列表 -->
    <div class="term-list">
      <div
        v-for="term in filteredTerms"
        :key="term.id"
        class="term-card"
      >
        <div class="term-main">
          <div class="term-en">{{ term.en }}</div>
          <div class="term-zh">{{ term.zh }}</div>
        </div>
        <div class="term-meta">
          <el-tag size="small">{{ term.theme_zh }}</el-tag>
          <span class="freq">词频: {{ term.frequency }}</span>
          <el-button
            text
            circle
            :type="favoritesStore.isFavorite(term.id) ? 'danger' : ''"
            @click.stop="favoritesStore.toggleFavorite(term)"
            class="favorite-btn"
          >
            <el-icon>
              <Star v-if="!favoritesStore.isFavorite(term.id)" />
              <StarFilled v-else />
            </el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <nav class="bottom-nav">
      <div class="nav-item" @click="goHome">
        <el-icon><Search /></el-icon>
        <span>搜索</span>
      </div>
      <div class="nav-item active" @click="goTerms">
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Collection, User, ArrowLeft, Star, StarFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import termsData from '../data/terms.json'
import { useFavoritesStore } from '../stores/favorites'

const router = useRouter()
const favoritesStore = useFavoritesStore()
const currentTheme = ref('all')

const themes = [
  { label: '全部', value: 'all' },
  { label: '和平与安全', value: 'peace' },
  { label: '经济发展', value: 'development' },
  { label: '气候环境', value: 'environment' },
  { label: '人权', value: 'human_rights' },
  { label: '卫生与健康', value: 'health' },
  { label: '文化教育', value: 'culture' }
]

const filteredTerms = computed(() => {
  if (currentTheme.value === 'all') {
    return termsData.data
  }
  return termsData.data.filter(t => t.theme === currentTheme.value)
})

onMounted(() => {
  console.log('术语库加载:', termsData.data.length, '条')
})

// 返回搜索结果页（优先）或上一页
const goBack = () => {
  const savedKeyword = sessionStorage.getItem('searchKeyword')
  if (savedKeyword) {
    const savedThemes = sessionStorage.getItem('searchThemes') || 'all'
    router.push({
      path: '/search',
      query: { q: savedKeyword, themes: savedThemes }
    })
  } else {
    router.push('/')
  }
}

const goHome = () => router.push('/')
const goTerms = () => {}
const goUser = () => router.push('/user')
</script>

<style scoped>
.term-bank {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.page-header {
  background: white;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  position: sticky;
  top: 0;
  z-index: 50;
}

.page-header h1 {
  font-size: 20px;
  color: #333;
  margin: 0;
}

.theme-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 15px;
  background: white;
  margin-bottom: 10px;
  position: sticky;
  top: 60px;
  z-index: 40;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.theme-tab {
  cursor: pointer;
  transition: all 0.3s;
}

.term-list {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 15px;
}

.term-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.term-main {
  margin-bottom: 10px;
}

.term-en {
  font-size: 18px;
  color: #5B92E5;
  font-weight: 600;
  margin-bottom: 5px;
}

.term-zh {
  font-size: 16px;
  color: #333;
}

.term-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.freq {
  color: #999;
  font-size: 13px;
}

.favorite-btn {
  margin-left: auto;
  font-size: 18px;
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

.nav-item.active {
  color: #5B92E5;
}

.nav-item .el-icon {
  font-size: 22px;
}
</style>