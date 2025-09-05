# End-to-End Testing Plan

## Objective
Validate that the complete discovery → analysis → generation workflow functions correctly across all supported platforms (YouTube Shorts, Instagram Reels, TikTok).

## Test Scenarios

### 1. YouTube Shorts Workflow
- Discover content by keyword
- Analyze discovered content
- Generate content based on analysis
- Verify data persistence in database

### 2. Instagram Reels Workflow
- Discover content by hashtag
- Analyze discovered content
- Generate content based on analysis
- Verify data persistence in database

### 3. TikTok Workflow
- Discover content by URL (manual input)
- Analyze discovered content
- Generate content based on analysis
- Verify data persistence in database

## Test Cases

### Test Case 1: YouTube Shorts Discovery
- Input: "fitness tips"
- Expected: 20+ YouTube Shorts videos returned
- Validation: Check that videos have proper metrics and viral scores
- Database: Verify entries are stored with correct platform identifier

### Test Case 2: Instagram Hashtag Discovery
- Input: "travel"
- Expected: 20+ Instagram posts returned
- Validation: Check that posts have proper metrics and viral scores
- Database: Verify entries are stored with correct platform identifier

### Test Case 3: TikTok URL Discovery
- Input: Valid TikTok video URL
- Expected: Single TikTok video returned
- Validation: Check that video has proper metrics and viral scores
- Database: Verify entry is stored with correct platform identifier

## Test Execution Steps

1. Run discovery for each platform with sample keywords/hashtags
2. Verify API responses contain expected data structure
3. Check that database entries are properly created/updated
4. Test analysis functionality on discovered content
5. Test generation functionality on analyzed content
6. Validate UI displays results correctly for each platform

## Expected Outcomes
- All platforms should return valid content
- Data should be consistently structured across platforms
- Database should properly store content from all platforms
- Analysis and generation should work for all platforms
- UI should display content appropriately for each platform
