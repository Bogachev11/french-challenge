# GitHub Pages Configuration

## Repository Settings

1. Go to your repository settings
2. Scroll down to "Pages" section
3. Set source to "GitHub Actions"
4. Save settings

## Environment Variables (GitHub Secrets)

Add these secrets to your repository:

1. Go to Settings → Secrets and variables → Actions
2. Add new repository secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `GOOGLE_SHEETS_API_KEY` | Your API key | Google Sheets API key |
| `GOOGLE_SHEETS_ID` | Your sheet ID | Google Sheets document ID |

## Custom Domain (Optional)

If you want to use a custom domain:

1. Add `CNAME` file to repository root
2. Update GitHub Pages settings
3. Configure DNS with your domain provider

## Deployment

The project will automatically deploy when you push to `main` branch.

Manual deployment:
```bash
npm run deploy
```

## Troubleshooting

### Common Issues

1. **Charts not loading**: Check if Google Sheets is publicly accessible
2. **API errors**: Verify API key and sheet permissions
3. **Deployment fails**: Check GitHub Actions logs

### Support

Contact: [@bogachev_al](https://twitter.com/bogachev_al)

