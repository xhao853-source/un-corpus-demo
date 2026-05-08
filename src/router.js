import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import SearchResultView from './views/SearchResultView.vue'
import TermBankView from './views/TermBankView.vue'
import UserView from './views/UserView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/search', name: 'search', component: SearchResultView },
  { path: '/terms', name: 'terms', component: TermBankView },
  { path: '/user', name: 'user', component: UserView }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router