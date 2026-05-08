<template>
  <div class="user-page">
    <header class="page-header">
      <el-button @click="goBack" text>
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1>👤 我的收藏</h1>
    </header>

    <div class="favorites-list" v-if="favoritesStore.favorites.length > 0">
      <div
        v-for="item in favoritesStore.favorites"
        :key="item.id"
        class="favorite-card"
      >
        <div class="fav-content">
          <div class="fav-zh">{{ item.zh }}</div>
          <div class="fav-en">{{ item.en }}</div>
        </div>
        <div class="fav-meta">
          <el-tag size="small">{{ item.theme }}</el-tag>
          <el-button 
            text 
            type="danger" 
            size="small"
            @click="favoritesStore.removeFavorite(item.id)"
          >
            取消收藏
          </el-button>
        </div>
      </div>
    </div>

    <el-empty v-else description="暂无收藏，去搜索页添加吧" />

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
      <div class="nav-item active" @click="goUser">
        <el-icon><User /></el-icon>
        <span>我的</span>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useFavoritesStore } from '../stores/favorites'
import { Search, Collection, User, ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const favoritesStore = useFavoritesStore()

// 返回搜索结果页（优先）或首页
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
const goTerms = () => router.push('/terms')
const goUser = () => {}
</script>

<style scoped>
.user-page {
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

.favorites-list {
  max-width: 900px;
  margin: 20px auto;
  padding: 0 15px;
}

.favorite-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.fav-content {
  margin-bottom: 10px;
}

.fav-zh {
  font-size: 16px;
  color: #333;
  margin-bottom: 5px;
}

.fav-en {
  font-size: 14px;
  color: #666;
  font-style: italic;
}

.fav-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
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