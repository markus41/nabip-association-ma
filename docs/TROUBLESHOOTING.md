# Troubleshooting Guide

Common issues and solutions for the NABIP AMS.

## Build Issues

### Build Fails with TypeScript Errors

**Problem**: TypeScript compilation errors prevent build from completing

**Solutions**:

1. **Skip type checking temporarily**:
   ```bash
   npm run build -- --noCheck
   ```

2. **Check for strict null check issues**:
   - Review `tsconfig.json` for strict null checks configuration
   - Ensure all nullable values are properly typed with `| null` or `| undefined`

3. **Verify path aliases**:
   - Check that `@/*` path mapping is configured in both `vite.config.ts` and `tsconfig.json`
   - Ensure all imports use `@/` prefix consistently

4. **Clear build cache**:
   ```bash
   rm -rf node_modules/.vite
   npm run optimize
   ```

### Build Succeeds but App Doesn't Load

**Problem**: Build completes but application shows blank screen or errors

**Solutions**:

1. **Check browser console** for JavaScript errors
2. **Verify Vite plugins**:
   - Ensure Spark plugin is configured correctly
   - Confirm Phosphor icon proxy plugin is present (DO NOT REMOVE)
3. **Clear browser cache** and hard reload (Ctrl+Shift+R / Cmd+Shift+R)

## Port Issues

### Port 5000 Already in Use

**Problem**: Development server can't start because port 5000 is occupied

**Solutions**:

1. **Use kill script** (Windows):
   ```bash
   npm run kill
   ```

2. **Manual process termination**:
   - Windows: `netstat -ano | findstr :5000` then `taskkill /PID <pid> /F`
   - Mac/Linux: `lsof -ti:5000 | xargs kill -9`

3. **Use different port**:
   - Modify `vite.config.ts` to use alternative port
   - Update `package.json` scripts accordingly

## State Management Issues

### State Not Persisting

**Problem**: Data doesn't persist across page refreshes

**Solutions**:

1. **Verify useKV hook usage**:
   ```typescript
   // Correct
   const [data, setData] = useKV<MyType[]>('ams-my-data', [])

   // Incorrect - missing key or using useState
   const [data, setData] = useState<MyType[]>([])
   ```

2. **Check browser storage**:
   - Open DevTools → Application → Storage
   - Look for KV entries with `ams-` prefix
   - Clear storage if corrupted: `localStorage.clear()`

3. **Verify data initialization**:
   ```typescript
   useEffect(() => {
     if (data.length === 0) {
       setData(generateData())
     }
   }, []) // Empty dependency array is crucial
   ```

### Data Resets Unexpectedly

**Problem**: State resets during development or after code changes

**Solutions**:

1. **Check for multiple initializations**:
   - Ensure generator functions only run when data is empty
   - Verify `useEffect` dependencies are correct

2. **Disable strict mode temporarily** (in `main.tsx`):
   ```typescript
   // Strict mode causes double-mounting in development
   // Only disable for debugging
   ReactDOM.createRoot(document.getElementById('root')!).render(
     <App />  // Instead of <React.StrictMode><App /></React.StrictMode>
   )
   ```

3. **Clear browser storage and refresh**:
   ```javascript
   // In browser console
   localStorage.clear()
   location.reload()
   ```

## Icon Issues

### Missing Phosphor Icons

**Problem**: Icons don't render or show as broken

**Solutions**:

1. **Verify Vite plugin configuration**:
   - Check `vite.config.ts` for `createIconImportProxy()` plugin
   - **DO NOT REMOVE** this plugin - it's required for Phosphor icons

2. **Check import syntax**:
   ```typescript
   // Correct
   import { User, Bell, Settings } from '@phosphor-icons/react'

   // Incorrect
   import User from '@phosphor-icons/react/User'
   ```

3. **Verify icon weight prop**:
   ```typescript
   <User weight="regular" size={24} />
   <Bell weight="fill" size={24} />  // Active state
   ```

## UI/Component Issues

### Shadcn/ui Components Not Rendering

**Problem**: UI components don't display correctly

**Solutions**:

1. **Verify component imports**:
   ```typescript
   import { Button } from '@/components/ui/button'
   import { Card, CardContent } from '@/components/ui/card'
   ```

2. **Check Tailwind CSS configuration**:
   - Ensure Tailwind v4 Vite plugin is configured
   - Verify Tailwind directives in main CSS file

3. **Avoid installing duplicate UI libraries**:
   - Use only Shadcn/ui components from `src/components/ui/`
   - Do not install additional component libraries

### Responsive Layout Broken

**Problem**: Mobile or tablet layout doesn't work correctly

**Solutions**:

1. **Check responsive breakpoints**:
   - Desktop: 1920px+
   - Tablet: 768-1919px
   - Mobile: <768px

2. **Verify mobile navigation**:
   - First 6 items in `navItems` show in mobile bottom nav
   - Ensure proper ordering for mobile display

3. **Test in DevTools**:
   - Use responsive design mode
   - Test at various viewport sizes

## Development Workflow Issues

### Hot Module Replacement (HMR) Not Working

**Problem**: Changes don't reflect immediately during development

**Solutions**:

1. **Restart dev server**:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Clear Vite cache**:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

3. **Check for syntax errors**:
   - Review console for compilation errors
   - Fix any TypeScript or ESLint errors

### Slow Development Server

**Problem**: Dev server is sluggish or unresponsive

**Solutions**:

1. **Optimize dependencies**:
   ```bash
   npm run optimize
   ```

2. **Reduce bundle size**:
   - Use dynamic imports for large components
   - Split code using React.lazy()

3. **Check system resources**:
   - Close unnecessary applications
   - Restart development environment

## Data/Mock Issues

### Mock Data Looks Unrealistic

**Problem**: Generated data doesn't appear realistic

**Solutions**:

1. **Review generator functions** in `src/lib/data-utils.ts`
2. **Update mock data arrays**:
   - Names, companies, email domains
   - Date ranges and timestamps
3. **Adjust generation counts** to match production scale

### Dashboard Statistics Don't Update

**Problem**: Dashboard stats don't reflect data changes

**Solutions**:

1. **Verify calculateDashboardStats()** is called when data changes
2. **Check dependencies** in useEffect hooks
3. **Force recalculation**:
   ```typescript
   useEffect(() => {
     const stats = calculateDashboardStats(members, events, transactions)
     setDashboardStats(stats)
   }, [members, events, transactions]) // Ensure all deps listed
   ```

## Getting Help

If issues persist after trying these solutions:

1. **Check GitHub Issues**: Review existing issues for similar problems
2. **Create New Issue**: Use GitHub issue templates for bug reports
3. **Review Recent Commits**: Check if recent changes introduced the issue
4. **Consult Documentation**: Review detailed docs in `docs/` folder
5. **Check Agent Assignments**: See `.github/agents/` for specialized troubleshooting agents
