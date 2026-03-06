# Homepage Integration Guide for HomeNewsPreview

## Quick Start

The `HomeNewsPreview` component is ready to be integrated into the homepage. Follow these steps:

### 1. Import the Component

Add this import at the top of `frontend/src/pages/Home/Home.jsx`:

```javascript
import HomeNewsPreview from '../../components/newsroom/HomeNewsPreview/HomeNewsPreview';
```

### 2. Place the Component

Add the component in your JSX return statement. Recommended placement is **after the hero section** and **before or after the platform features section**.

Example placement:

```jsx
return (
  <div className="homepage">
    {/* Scroll Progress Bar */}
    <div className="scroll-progress-bar" ...></div>

    {/* Hero Section */}
    <section className="hero-section-enhanced" ...>
      ... existing hero content ...
    </section>

    {/* ⭐ ADD THIS - Newsroom Preview Section */}
    <HomeNewsPreview />

    {/* Rest of your existing sections */}
    <section className="platform-features" ...>
      ... existing features ...
    </section>

    ... rest of the page ...
  </div>
);
```

### 3. Verify the Component Works

The component will:
- ✅ Automatically fetch the latest 3 published articles
- ✅ Display them in a responsive grid
- ✅ Show a loading spinner while fetching
- ✅ Hide itself if no articles are available
- ✅ Include "View All Articles" and "Submit Article" buttons

### 4. Alternative Placements

You can also place the component:

**Option A: Before Footer** (bottom of page)
```jsx
{/* Platform sections... */}

{/* Newsroom Preview - just before scroll-to-top button */}
<HomeNewsPreview />

{/* Scroll to Top Button */}
<button className="scroll-to-top-btn" ...></button>
```

**Option B: Between Sections** (mid-page)
```jsx
{/* Features Section */}
<section className="features" ...></section>

{/* Newsroom Preview */}
<HomeNewsPreview />

{/* Testimonials Section */}
<section className="testimonials" ...></section>
```

## Customization Options

### Change Number of Articles

Edit `HomeNewsPreview.jsx` line 23:

```javascript
const response = await newsroomAPI.getPublicArticles({ 
  page: 1, 
  limit: 3, // Change this to 4, 5, or 6
  status: 'published',
  approvalStatus: 'approved'
});
```

### Adjust Grid Layout

Edit `HomeNewsPreview.css` line 67:

```css
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  /* Change 320px to adjust minimum card width */
  /* Or use fixed columns: */
  /* grid-template-columns: repeat(3, 1fr); */
  gap: 2rem;
}
```

### Change Colors

The component uses CSS variables from your theme:
- `--primary-color` - Button backgrounds
- `--secondary-color` - Category badges
- `--text-primary` - Headings
- `--text-secondary` - Body text
- `--surface-color` - Card backgrounds

## Testing

After integration, test:

1. **With Articles**: Navigate to `/news/submit` and create 2-3 test articles
2. **Admin Approval**: Login as admin and approve the articles
3. **Homepage Display**: Refresh homepage and verify articles appear
4. **Click Interactions**:
   - "Read Article" → navigates to article detail page
   - "View All Articles" → navigates to `/news`
   - "Submit Article" → navigates to `/news/submit`

5. **Responsive Testing**:
   - Desktop (1920px)
   - Tablet (768px)
   - Mobile (375px)

6. **Loading State**: Clear cache and refresh to see spinner
7. **Empty State**: Delete all articles - component should not render

## Troubleshooting

### Component Not Showing
- Check if articles exist in database with `status: 'published'` and `approvalStatus: 'approved'`
- Check browser console for API errors
- Verify backend is running on port 3000

### Articles Not Loading
- Ensure `/api/newsroom/articles` endpoint is working
- Check CORS settings if using different ports
- Verify authentication token is valid

### Styling Issues
- Import order matters - component CSS should load after global styles
- Check if CSS variables are defined in `styles/variables.css`
- Clear browser cache

## Next Steps

After integration:
1. Test on different screen sizes
2. Adjust section spacing if needed
3. Consider adding section dividers or background colors
4. Monitor performance (should be fast with only 3 articles)
5. Add analytics tracking for article clicks

## API Endpoint Used

```
GET /api/newsroom/articles
Query params:
  - page: 1
  - limit: 3
  - status: published
  - approvalStatus: approved
```

Ensure this endpoint is accessible without authentication for public viewing.

## File Locations

- Component: `frontend/src/components/newsroom/HomeNewsPreview/HomeNewsPreview.jsx`
- Styles: `frontend/src/components/newsroom/HomeNewsPreview/HomeNewsPreview.css`
- API Service: `frontend/src/services/api/newsroom.js` (getPublicArticles method)

---

**That's it!** The component is self-contained and ready to use. Just import and place it in your JSX.
