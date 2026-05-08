<template>
  <div class="home">
    <!-- 顶部标签栏 -->
    <div class="top-bar">
      <span class="category-tag">国际公文写作</span>
    </div>

    <!-- 标题区域 -->
    <header class="header">
      <h1 class="main-title">
        联合国文件中英平行语料库<br>
        <span class="sub-title">The United Nations Document Chinese-English Parallel Corpus</span>
      </h1>
    </header>

    <!-- 搜索区域 -->
    <div class="search-section">
      <div class="search-box" v-click-outside="closeSuggestions">
        <div class="input-wrapper">
          <el-input
            v-model="searchKeyword"
            placeholder="输入英文或中文关键词"
            size="large"
            clearable
            @keyup.enter="handleSearch"
            @focus="showSuggestions = suggestions.length > 0"
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <!-- 联想下拉 -->
          <div v-if="showSuggestions" class="suggestions-dropdown">
            <div
              v-for="word in suggestions"
              :key="word"
              class="suggestion-item"
              @click="selectSuggestion(word)"
            >
              <el-icon><Search /></el-icon>
              <span>{{ word }}</span>
            </div>
          </div>
        </div>
        
        <el-button 
          type="primary" 
          size="large" 
          @click="handleSearch"
          class="search-btn"
        >
          搜索
        </el-button>
      </div>

      <!-- 主题筛选 -->
      <div class="theme-filter">
        <span class="filter-label">筛选主题：</span>
        <el-check-tag
          v-for="theme in allThemes"
          :key="theme.value"
          :checked="selectedThemes.includes(theme.value)"
          @change="toggleTheme(theme.value)"
          class="theme-tag"
        >
          {{ theme.label }}
        </el-check-tag>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats">
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="stat-item">
            <el-statistic title="总语料数" :value="totalCount" />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <el-statistic title="主题分类" :value="6" />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item">
            <el-statistic title="覆盖年份" value="2023" />
          </div>
        </el-col>
      </el-row>
      <div class="stats-note">*语料来源为联合国文件官网公开文件</div>
    </div>

    <!-- 底部导航 -->
    <nav class="bottom-nav">
      <div class="nav-item active" @click="goHome">
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
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Collection, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import corpusData from '../data/corpus.json'
import { chineseTokenizer } from '../utils/chineseTokenizer'

const router = useRouter()

const totalCount = ref(0)
const searchKeyword = ref('')
const selectedThemes = ref(['all'])

// 联想相关
const suggestions = ref([])
const showSuggestions = ref(false)
let suggestTimer = null

// 从语料和术语库中提取词汇用于联想
const allWords = ref([]) // 英文词汇

const allThemes = [
  { label: '全部', value: 'all' },
  { label: '和平与安全', value: 'peace' },
  { label: '经济发展', value: 'development' },
  { label: '气候环境', value: 'environment' },
  { label: '人权', value: 'human_rights' },
  { label: '卫生与健康', value: 'health' },
  { label: '文化教育', value: 'culture' }
]

onMounted(async () => {
  totalCount.value = corpusData.metadata.total_count
  
  // 提取语料中的词汇用于联想
  const words = new Set()
  
  // 从语料提取
  corpusData.data.forEach(item => {
    // 英文：按空格拆分，保留长度>3的词
    item.en.toLowerCase().split(/\s+/).forEach(w => {
      w = w.replace(/[.,;:!?()"]/g, '')
      if (w.length > 3 && !isStopWord(w)) words.add(w)
    })
    
    // 中文：直接提取连续中文字符串（长度2-20）加入词典
    const zhMatches = item.zh.match(/[\u4e00-\u9fa5]{2,20}/g) || []
    zhMatches.forEach(w => {
      if (!isChineseStopWord(w)) chineseTokenizer.addWord(w)
    })
  })
  
  // 从术语库提取（高优先级，术语最准确）
  try {
    const termsModule = await import('../data/terms.json')
    const termsData = termsModule.default || termsModule
    termsData.data.forEach(t => {
      words.add(t.en.toLowerCase())
      // 术语库的中文术语直接加入词典
      if (t.zh && t.zh.length >= 2) {
        chineseTokenizer.addWord(t.zh)
      }
    })
    console.log('术语库加载成功:', termsData.data.length, '条')
  } catch(e) {
    console.log('术语库未加载:', e.message)
  }
  
  allWords.value = Array.from(words)
  console.log('英文联想词库:', allWords.value.length, '个词汇')
  console.log('中文分词词典:', chineseTokenizer.size, '个词汇')
})

// 停用词过滤（包含常见中文词汇）
const stopWords = new Set([
  // 英文停用词
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'been', 'were', 'are', 'will', 'should', 'would', 'could', 'shall', 'must', 'may', 'might', 'also', 'such', 'each', 'all', 'any', 'some', 'many', 'more', 'most', 'other', 'than', 'only', 'even', 'well', 'just', 'about', 'into', 'over', 'under', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'within', 'without', 'against', 'towards', 'regard', 'regards', 'further', 'however', 'therefore', 'thereof', 'whereas', 'pursuant', 'accordance', 'article', 'paragraph', 'resolution', 'report', 'session', 'meeting', 'committee', 'assembly', 'council', 'commission', 'general', 'security', 'economic', 'social', 'international', 'national', 'state', 'states', 'government', 'country', 'countries', 'organization', 'organizations', 'programme', 'programmes', 'conference', 'conferences', 'convention', 'conventions', 'treaty', 'treaties', 'agreement', 'agreements', 'protocol', 'protocols', 'declaration', 'declarations', 'recommendation', 'recommendations', 'decision', 'decisions', 'document', 'documents', 'note', 'notes', 'letter', 'letters', 'dated', 'annex', 'annexes', 'appendix', 'appendices', 'agenda', 'item', 'items', 'draft', 'final', 'official', 'unofficial', 'confidential', 'public', 'private', 'internal', 'external', 'bilateral', 'multilateral', 'regional', 'global', 'world', 'united', 'nations',
  // 中文停用词
  '的', '是', '在', '和', '了', '与', '对', '为', '以', '及', '等', '或', '以及', '关于', '对于', '根据', '按照', '通过', '经过', '由于', '为了', '我们', '你们', '他们', '她们', '这些', '那些', '这个', '那个', '一项', '本', '该', '各', '某些', '任何'
])

function isStopWord(word) {
  return stopWords.has(word.toLowerCase())
}

// 中文停用词（用于词典构建时过滤）
const chineseStopWords = new Set(['的', '是', '在', '和', '了', '与', '对', '为', '以', '及', '等', '或', '以及', '关于', '对于', '根据', '按照', '通过', '经过', '由于', '为了', '我们', '你们', '他们', '这些', '那些', '这个', '那个', '一项', '本', '该', '各', '某些', '任何'])

function isChineseStopWord(word) {
  return chineseStopWords.has(word)
}

// 监听输入，延迟300ms联想
watch(searchKeyword, (val) => {
  clearTimeout(suggestTimer)
  if (!val || val.length < 1) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }
  
  suggestTimer = setTimeout(() => {
    const lowerVal = val.toLowerCase()
    
    // 判断输入语言
    const isChinese = /[\u4e00-\u9fa5]/.test(val)
    
    if (isChinese) {
      // 中文联想：使用分词器的搜索功能，返回1-2个词的短语
      suggestions.value = chineseTokenizer.search(val, 8)
    } else {
      // 英文联想：直接匹配
      suggestions.value = allWords.value
        .filter(w => w.toLowerCase().includes(lowerVal))
        .slice(0, 8)
    }
    
    showSuggestions.value = suggestions.value.length > 0
  }, 300)
})

const selectSuggestion = (word) => {
  searchKeyword.value = word
  showSuggestions.value = false
}

const closeSuggestions = () => {
  showSuggestions.value = false
}

const toggleTheme = (theme) => {
  if (theme === 'all') {
    selectedThemes.value = ['all']
  } else {
    const index = selectedThemes.value.indexOf('all')
    if (index > -1) selectedThemes.value.splice(index, 1)
    
    const themeIndex = selectedThemes.value.indexOf(theme)
    if (themeIndex > -1) {
      selectedThemes.value.splice(themeIndex, 1)
      if (selectedThemes.value.length === 0) selectedThemes.value = ['all']
    } else {
      selectedThemes.value.push(theme)
    }
  }
}

const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    alert('请输入搜索关键词')
    return
  }
  showSuggestions.value = false
  router.push({
    path: '/search',
    query: {
      q: searchKeyword.value,
      themes: selectedThemes.value.join(',')
    }
  })
}

const goHome = () => router.push('/')
const goTerms = () => router.push('/terms')
const goUser = () => router.push('/user')
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-bottom: 80px;
}

.top-bar {
  padding: 20px 30px 0;
  text-align: left;
}

.category-tag {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.header {
  text-align: center;
  padding: 30px 20px 40px;
  color: white;
}

.main-title {
  font-size: 32px;
  line-height: 1.4;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  font-weight: 600;
}

.sub-title {
  font-size: 18px;
  opacity: 0.85;
  font-weight: 400;
  display: block;
  margin-top: 8px;
  letter-spacing: 0.5px;
}

.search-section {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 20px;
}

.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: flex-start;
}

.input-wrapper {
  flex: 1;
  position: relative;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  padding: 4px 15px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  min-height: 44px;
}

/* 联想下拉 */
.suggestions-dropdown {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  z-index: 100;
  max-height: 300px;
  overflow-y: auto;
  padding: 8px 0;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
  font-size: 14px;
}

.suggestion-item:hover {
  background: #f0f5ff;
  color: #5B92E5;
}

.suggestion-item .el-icon {
  color: #999;
  font-size: 16px;
}

.search-btn {
  border-radius: 12px;
  padding: 0 30px;
  font-size: 16px;
  background: #5B92E5;
  border: none;
  box-shadow: 0 4px 15px rgba(91, 146, 229, 0.4);
  height: 44px;
  display: flex;
  align-items: center;
}

.search-btn:hover {
  background: #4a7fd4;
  transform: translateY(-2px);
  transition: all 0.3s;
}

.theme-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 30px;
  justify-content: center;
}

.filter-label {
  color: white;
  font-size: 14px;
  margin-right: 5px;
}

.theme-tag {
  cursor: pointer;
  transition: all 0.3s;
  background: rgba(255,255,255,0.2);
  color: white;
  border: 1px solid rgba(255,255,255,0.3);
}

.theme-tag:hover {
  background: rgba(255,255,255,0.3);
}

:deep(.el-check-tag.is-checked) {
  background: #5B92E5 !important;
  color: white !important;
  border-color: #5B92E5 !important;
}

.stats {
  max-width: 700px;
  margin: 40px auto;
  padding: 30px;
  background: rgba(255,255,255,0.95);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.stat-item {
  text-align: center;
}

.stats-note {
  text-align: center;
  margin-top: 15px;
  font-size: 12px;
  color: #999;
  font-style: italic;
}

:deep(.el-statistic__number) {
  color: #5B92E5 !important;
  font-size: 28px !important;
  font-weight: bold;
}

:deep(.el-statistic__title) {
  color: #666;
  font-size: 14px;
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

@media (max-width: 768px) {
  .main-title {
    font-size: 24px;
  }
  
  .sub-title {
    font-size: 14px;
  }
  
  .search-box {
    flex-direction: column;
  }
  
  .search-btn {
    width: 100%;
    padding: 12px;
  }
}
</style>