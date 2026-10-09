const fs = require('fs');
let content = fs.readFileSync('src/lib/api.ts', 'utf8');

const oldLogic = `    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(\`\${API_BASE_URL}/auth/refresh\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ refreshToken: refreshToken || undefined }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newAccessToken = refreshData?.data?.accessToken || refreshData?.accessToken;
          const newRefreshToken = refreshData?.data?.refreshToken || refreshData?.refreshToken;

          if (newAccessToken) {
            setTokens(newAccessToken, newRefreshToken);
            isRefreshing = false;
            onRefreshed(newAccessToken);
          } else {
            clearTokens();
            isRefreshing = false;
            onRefreshed(null);
            return response;
          }
        } else {
          clearTokens();
          isRefreshing = false;
          onRefreshed(null);
          return response;
        }
      } catch (err) {
        clearTokens();
        isRefreshing = false;
        onRefreshed(null);
        return response;
      }
    }

    const newAccessToken = await new Promise<string | null>((resolve) => {
      addRefreshSubscriber(resolve);
    });

    if (newAccessToken) {
      headers.set('Authorization', \`Bearer \${newAccessToken}\`);
      response = await fetch(url, {
        ...config,
        headers,
      });
    }`;

const newLogic = `    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(\`\${API_BASE_URL}/auth/refresh\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ refreshToken: refreshToken || undefined }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newAccessToken = refreshData?.data?.accessToken || refreshData?.accessToken;
          const newRefreshToken = refreshData?.data?.refreshToken || refreshData?.refreshToken;

          if (newAccessToken) {
            setTokens(newAccessToken, newRefreshToken);
            isRefreshing = false;
            onRefreshed(newAccessToken);
            
            headers.set('Authorization', \`Bearer \${newAccessToken}\`);
            return await fetch(url, { ...config, headers });
          }
        }
      } catch (err) {
        // Fallthrough
      }
      clearTokens();
      isRefreshing = false;
      onRefreshed(null);
      return response;
    } else {
      const newAccessToken = await new Promise<string | null>((resolve) => {
        addRefreshSubscriber(resolve);
      });

      if (newAccessToken) {
        headers.set('Authorization', \`Bearer \${newAccessToken}\`);
        return await fetch(url, { ...config, headers });
      }
    }`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync('src/lib/api.ts', content);
console.log("api.ts patched");
