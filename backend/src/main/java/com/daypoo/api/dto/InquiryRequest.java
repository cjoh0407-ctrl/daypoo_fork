package com.daypoo.api.dto;

import com.daypoo.api.entity.InquiryType;

public record InquiryRequest(InquiryType type, String content) {}
