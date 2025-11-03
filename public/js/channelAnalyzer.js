function clearResults() {
            resultsContainer.innerHTML = '';
            clearError();
            filterContainerWrapper.classList.add('hidden');
            analysisButtonContainer.classList.add('hidden');
            analysisResults.classList.add('hidden');
            analysisButton.textContent = '📊 Phân tích Kênh';
            analysisButton.classList.replace('bg-gray-500', 'bg-purple-600');
            if (analysisTitle) { analysisTitle.textContent = 'Phân Tích Thói Quen Đăng Video'; }
            destroyCharts();
            
            while (yearFilter.options.length > 1) {
                yearFilter.remove(1);
            }
            yearFilter.value = "0";
            yearFilter.options[0].textContent = 'Tất cả năm'; 
            
            viewsFilter.value = "0";
            
            videoTypeFilter.value = 'all';
            updateTypeFilterCounts([]); 

            timezoneFilter.value = 'local';
            
            showKeywords = false;
            toggleKeywordsButton.textContent = 'Hiện Từ khóa';
            toggleKeywordsButton.classList.replace('bg-red-600', 'bg-green-600');
            allFetchedVideos = [];

            isAnalysisActive = false;
            topHours = [];
            topDays = [];
        }
