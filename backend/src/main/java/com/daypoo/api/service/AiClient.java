package com.daypoo.api.service;

import com.daypoo.api.dto.AiAnalysisRequest;
import com.daypoo.api.dto.AiAnalysisResponse;
import com.daypoo.api.dto.AiReportRequest;
import com.daypoo.api.dto.HealthReportResponse;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiClient {

    private final RestTemplate restTemplate;

    @Value("${ai-service.url}")
    private String aiServiceUrl;

    private static final String CORRELATION_ID_LOG_VAR_NAME = "correlationId";
    private static final String CORRELATION_ID_HEADER = "X-Correlation-Id";

    /**
     * Python AI 서비스에 이미지를 보내 배변 상태 분석 요청
     */
    public AiAnalysisResponse analyzePoopImage(String base64Image) {
        String url = aiServiceUrl + "/api/v1/analysis/analyze";
        
        AiAnalysisRequest request = new AiAnalysisRequest(base64Image);
        HttpEntity<AiAnalysisRequest> entity = new HttpEntity<>(request, createHeaders());
        
        try {
            log.info("Requesting AI analysis to {}", url);
            return restTemplate.postForObject(url, entity, AiAnalysisResponse.class);
        } catch (Exception e) {
            log.error("Failed to call AI Service: {}", e.getMessage());
            throw new BusinessException(ErrorCode.AI_SERVICE_ERROR);
        }
    }

    /**
     * Python AI 서비스에 기간별 기록 데이터를 보내 건강 리포트 생성 요청
     */
    public HealthReportResponse analyzeHealthReport(AiReportRequest request) {
        String url = aiServiceUrl + "/api/v1/report/generate";
        HttpEntity<AiReportRequest> entity = new HttpEntity<>(request, createHeaders());

        try {
            log.info("Requesting AI report analysis for user {} ({})", request.userId(), request.reportType());
            return restTemplate.postForObject(url, entity, HealthReportResponse.class);
        } catch (Exception e) {
            log.error("Failed to call AI Report Service: {}", e.getMessage());
            throw new BusinessException(ErrorCode.AI_SERVICE_ERROR);
        }
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String correlationId = MDC.get(CORRELATION_ID_LOG_VAR_NAME);
        if (correlationId != null) {
            headers.set(CORRELATION_ID_HEADER, correlationId);
        }
        return headers;
    }
}
