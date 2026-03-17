package com.daypoo.api.service;

import com.daypoo.api.dto.FaqResponse;
import com.daypoo.api.dto.InquiryRequest;
import com.daypoo.api.dto.InquiryResponse;
import com.daypoo.api.entity.Faq;
import com.daypoo.api.entity.Inquiry;
import com.daypoo.api.entity.User;
import com.daypoo.api.repository.FaqRepository;
import com.daypoo.api.repository.InquiryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class SupportService {

    private final InquiryRepository inquiryRepository;
    private final FaqRepository faqRepository;

    /**
     * 1:1 문의 등록
     */
    public void createInquiry(User user, InquiryRequest request) {
        Inquiry inquiry = Inquiry.builder()
                .user(user)
                .type(request.type())
                .content(request.content())
                .build();
        inquiryRepository.save(inquiry);
    }

    /**
     * 내 문의 내역 조회
     */
    @Transactional(readOnly = true)
    public List<InquiryResponse> getMyInquiries(User user) {
        return inquiryRepository.findAllByUserOrderByCreatedAtDesc(user).stream()
                .map(i -> InquiryResponse.builder()
                        .id(i.getId())
                        .type(i.getType())
                        .content(i.getContent())
                        .answer(i.getAnswer())
                        .status(i.getStatus())
                        .createdAt(i.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * 카테고리별 FAQ 조회
     */
    @Transactional(readOnly = true)
    public List<FaqResponse> getFaqs(String category) {
        List<Faq> faqs = (category == null || category.isEmpty()) 
                ? faqRepository.findAll() 
                : faqRepository.findAllByCategoryOrderByCreatedAtDesc(category);
                
        return faqs.stream()
                .map(f -> FaqResponse.builder()
                        .id(f.getId())
                        .category(f.getCategory())
                        .question(f.getQuestion())
                        .answer(f.getAnswer())
                        .build())
                .collect(Collectors.toList());
    }
}
