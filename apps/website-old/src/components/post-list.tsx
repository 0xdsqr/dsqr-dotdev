import { useState, useEffect } from 'react'
import { Link, useRouter, useSearch } from '@tanstack/react-router'
import { EyeIcon, TagIcon, ChevronUpIcon, ChevronDownIcon, CalendarIcon, FilterIcon, RefreshCcwIcon } from 'lucide-react'
import type { Post } from '@/lib/content'

interface PostListProps {
  posts: Post[]
}

type CategoryFilter = 'All' | 'TIL' | 'Blog' | 'Life' | 'NixWithMe'
type SortBy = 'date' | 'views'
type SortOrder = 'asc' | 'desc'

export function PostList({ posts }: PostListProps) {
  const router = useRouter()
  // Define a type for the search params
  interface SearchParams {
    category?: CategoryFilter;
    sort?: SortBy;
    order?: string;
    showEvolving?: string;
    [key: string]: any;
  }
  
  let search: SearchParams = {};
  try {
    search = useSearch({ from: '/posts' }) as SearchParams;
  } catch (error) {
    // Handle case where route doesn't match
    console.log('Route not matched for search params');
  }
  
  // Initialize state from URL query parameters
  const [sortAscending, setSortAscending] = useState<boolean>(search.order === 'asc')
  const [sortBy, setSortBy] = useState<SortBy>(search.sort === 'views' ? 'views' : 'date')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(
    (search.category as CategoryFilter) || 'All'
  )
  const [showEvolving, setShowEvolving] = useState<boolean>(search.showEvolving === 'true')
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false)
  
  // Update URL when filters change
  useEffect(() => {
    try {
      const newSearch = {
        ...search,
        category: categoryFilter === 'All' ? undefined : categoryFilter,
        sort: sortBy,
        order: sortAscending ? 'asc' : 'desc',
        showEvolving: showEvolving ? 'true' : undefined,
      }
      
      // Remove undefined values
      Object.keys(newSearch).forEach(key => {
        const typedKey = key as keyof typeof newSearch;
        if (newSearch[typedKey] === undefined) {
          delete newSearch[typedKey]
        }
      })
      
      router.navigate({
        search: newSearch as any,
        replace: true,
      })
    } catch (error) {
      console.error('Failed to update URL with search params', error);
    }
  }, [sortAscending, sortBy, categoryFilter, showEvolving, router])

  const filteredAndSortedPosts = [...posts]
    // Filter by category
    .filter((post) => categoryFilter === 'All' || post.category === categoryFilter)
    // Filter evolving posts unless explicitly shown
    .filter((post) => showEvolving || post.status !== 'evolving')
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return sortAscending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
      } else {
        // For views, we're using a mock number 1 for all posts now
        return sortAscending ? 1 - 1 : 1 - 1
      }
    })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setSortBy('date')
              setSortAscending(sortBy === 'date' ? !sortAscending : false)
            }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Date</span>
            {sortBy === 'date' &&
              (sortAscending ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />)}
          </button>
          <button
            onClick={() => {
              setSortBy('views')
              setSortAscending(sortBy === 'views' ? !sortAscending : false)
            }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <EyeIcon className="w-4 h-4" />
            <span>Views</span>
            {sortBy === 'views' &&
              (sortAscending ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />)}
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Mobile dropdown filter */}
          <div className="relative sm:hidden">
            <button
              onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <FilterIcon className="w-4 h-4" />
              <span>Filter</span>
              {isMobileFiltersOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            </button>
            
            {/* Dropdown menu for filter categories on mobile */}
            <div className={`absolute left-0 top-full mt-1 z-10 bg-background border border-border rounded-md shadow-md p-1 min-w-[150px] ${isMobileFiltersOpen ? 'block' : 'hidden'}`}>
              <div className="flex flex-col gap-1">
                {/* Category buttons */}
                {(['All', 'Blog', 'TIL', 'Life', 'NixWithMe'] as const).map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setCategoryFilter(category);
                      setIsMobileFiltersOpen(false);
                    }}
                    className={`flex justify-between items-center px-2 py-1 text-xs rounded-md transition-colors ${
                      categoryFilter === category
                        ? category === 'All'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                          : category === 'Blog'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                            : category === 'TIL'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                              : category === 'NixWithMe'
                                ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300'
                                : category === 'Life'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <span>{category}</span>
                    {categoryFilter === category && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </button>
                ))}
                
                {/* Divider in dropdown */}
                <div className="h-px w-full bg-border my-1"></div>
                
                {/* Evolving toggle in dropdown */}
                <button
                  onClick={() => {
                    setShowEvolving(!showEvolving);
                    setIsMobileFiltersOpen(false);
                  }}
                  className={`flex justify-between items-center px-2 py-1 text-xs rounded-md transition-colors ${
                    showEvolving 
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 evolving-icon">
                      <path d="M12 3v5m4 4h5m-9 4v5M7 8H2m3.516 9.504L8.5 14.5m7-5l3.016-3.016M7.5 8.5l-3-3m15 15l-3-3M15.5 15.5l3 3M8.5 14.5l-3 3"></path>
                    </svg>
                    <span>Evolving</span>
                  </div>
                  {showEvolving && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Desktop filter buttons - all filters in one group */}
          <div className="hidden sm:flex items-center gap-1">
            <FilterIcon className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {/* Category filters */}
              {(['All', 'Blog', 'TIL', 'Life', 'NixWithMe'] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    categoryFilter === category
                      ? category === 'All'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        : category === 'Blog'
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                          : category === 'TIL'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                            : category === 'NixWithMe'
                              ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300'
                              : category === 'Life'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {category}
                </button>
              ))}
              
              {/* Evolving toggle right in the filters row */}
              <button
                onClick={() => setShowEvolving(!showEvolving)}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                  showEvolving 
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' 
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
                title={showEvolving ? "Hide evolving posts" : "Show posts being actively updated"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 evolving-icon">
                  <path d="M12 3v5m4 4h5m-9 4v5M7 8H2m3.516 9.504L8.5 14.5m7-5l3.016-3.016M7.5 8.5l-3-3m15 15l-3-3M15.5 15.5l3 3M8.5 14.5l-3 3"></path>
                </svg>
                <span>Evolving</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredAndSortedPosts.length > 0 ? (
          filteredAndSortedPosts.map((post) => (
            <Link key={post._id} to={post.url} className="block group">
              <article className="p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <h2 className="text-base sm:text-lg font-medium mb-2 group-hover:text-primary transition-colors leading-snug">
                  {post.title}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                    <span>{new Date(post.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <EyeIcon className="w-4 h-4 flex-shrink-0" />
                    <span>{post.views !== undefined ? post.views : '–'}</span>
                  </div>
                  <div
                    className={`flex items-center gap-1 ${
                      post.category === 'TIL'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : post.category === 'Blog'
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : post.category === 'NixWithMe'
                            ? 'text-cyan-600 dark:text-cyan-400'
                            : post.category === 'Life'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <TagIcon className="w-3 h-3 flex-shrink-0" />
                    <span>{post.category}</span>
                  </div>
                  {post.status === 'evolving' && (
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 evolving-icon">
                        <path d="M12 3v5m4 4h5m-9 4v5M7 8H2m3.516 9.504L8.5 14.5m7-5l3.016-3.016M7.5 8.5l-3-3m15 15l-3-3M15.5 15.5l3 3M8.5 14.5l-3 3"></path>
                      </svg>
                      <span className="text-xs font-medium">Evolving</span>
                    </div>
                  )}
                </div>
              </article>
            </Link>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {!showEvolving && posts.some(post => post.status === 'evolving') ? (
              <span>
                No published posts found matching your filter. 
                <button 
                  onClick={() => setShowEvolving(true)}
                  className="ml-2 text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 inline-flex"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 evolving-icon">
                    <path d="M12 3v5m4 4h5m-9 4v5M7 8H2m3.516 9.504L8.5 14.5m7-5l3.016-3.016M7.5 8.5l-3-3m15 15l-3-3M15.5 15.5l3 3M8.5 14.5l-3 3"></path>
                  </svg>
                  <span>Show evolving posts?</span>
                </button>
              </span>
            ) : (
              <span>No posts found matching your filter.</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}