/**
 * 轻量级中文分词器
 * 使用正向最大匹配算法（Forward Maximum Matching）
 * 词典从语料库和术语库中提取
 */

// 中文停用词
const STOP_WORDS = new Set([
  '的', '是', '在', '和', '了', '与', '对', '为', '以', '及', '等', '或', '以及',
  '关于', '对于', '根据', '按照', '通过', '经过', '由于', '为了', '我们', '你们',
  '他们', '这些', '那些', '这个', '那个', '一项', '本', '该', '各', '某些', '任何'
])

export class ChineseTokenizer {
  constructor() {
    this.dictionary = new Set()
    this.maxWordLength = 8
  }

  /**
   * 添加词汇到词典
   */
  addWord(word) {
    if (word && word.length >= 2 && word.length <= this.maxWordLength) {
      this.dictionary.add(word)
    }
  }

  /**
   * 批量添加词汇
   */
  addWords(words) {
    words.forEach(w => this.addWord(w))
  }

  /**
   * 正向最大匹配分词
   * @param {string} text - 待分词文本
   * @returns {string[]} 分词结果
   */
  tokenize(text) {
    if (!text || !text.trim()) return []
    
    const result = []
    let i = 0
    const len = text.length
    
    while (i < len) {
      // 跳过非中文字符
      if (!/[\u4e00-\u9fa5]/.test(text[i])) {
        i++
        continue
      }
      
      // 从当前位置开始，找最大匹配
      let matched = text[i]
      let j = i + 1
      
      while (j < len && j - i < this.maxWordLength) {
        const candidate = text.substring(i, j + 1)
        if (this.dictionary.has(candidate)) {
          matched = candidate
        }
        j++
      }
      
      // 过滤停用词
      if (!STOP_WORDS.has(matched) || matched.length >= 3) {
        result.push(matched)
      }
      
      i += matched.length || 1
    }
    
    return result
  }

  /**
   * 提取文本中的关键词（去重）
   * @param {string} text - 待处理文本
   * @returns {string[]} 关键词列表
   */
  extractKeywords(text) {
    return [...new Set(this.tokenize(text))]
  }

  /**
   * 搜索匹配的词（以用户输入开头的词）
   * @param {string} prefix - 用户输入
   * @param {number} limit - 返回数量限制
   * @returns {string[]} 匹配的词列表
   */
  search(prefix, limit = 8) {
    if (!prefix) return []
    
    const results = []
    
    // 遍历词典，找到所有以 prefix 开头的词
    for (const word of this.dictionary) {
      if (word.startsWith(prefix)) {
        results.push(word)
      }
    }
    
    // 排序：优先返回短词（更精确的匹配）
    results.sort((a, b) => a.length - b.length)
    
    return results.slice(0, limit)
  }

  /**
   * 获取词典大小
   */
  get size() {
    return this.dictionary.size
  }
}

// 创建全局分词器实例
export const chineseTokenizer = new ChineseTokenizer()
