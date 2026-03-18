package com.daypoo.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Builder;

@Builder
public record PooRecordCreateRequest(
    @NotNull(message = "화장실 정보는 필수입니다.") Long toiletId,
    @Min(value = 1, message = "브리스톨 척도는 1에서 7 사이여야 합니다.")
        @Max(value = 7, message = "브리스톨 척도는 1에서 7 사이여야 합니다.")
        Integer bristolScale,
    @NotBlank(message = "변 색상은 필수입니다.") String color,
    List<String> conditionTags,
    List<String> dietTags,
    @NotNull(message = "위도는 필수입니다.") double latitude,
    @NotNull(message = "경도는 필수입니다.") double longitude,
    String imageBase64 // AI 분석용 (Optional)
    ) {}
