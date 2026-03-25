package com.daypoo.api.service;

import com.daypoo.api.dto.*;
import com.daypoo.api.entity.*;
import com.daypoo.api.entity.enums.InquiryStatus;
import com.daypoo.api.entity.enums.InquiryType;
import com.daypoo.api.entity.enums.ItemType;
import com.daypoo.api.entity.enums.Role;
import com.daypoo.api.global.exception.BusinessException;
import com.daypoo.api.global.exception.ErrorCode;
import com.daypoo.api.repository.*;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminManagementService {

  private final UserRepository userRepository;
  private final ToiletRepository toiletRepository;
  private final InquiryRepository inquiryRepository;
  private final ItemRepository itemRepository;
  private final InventoryRepository inventoryRepository;
  private final PaymentRepository paymentRepository;

  // --- 유저 관리 ---

  @Transactional(readOnly = true)
  public Page<AdminUserListResponse> getUsers(String search, Role role, Pageable pageable) {
    Specification<User> spec =
        (root, query, cb) -> {
          List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
          if (search != null && !search.isBlank()) {
            predicates.add(
                cb.or(
                    cb.like(root.get("email"), "%" + search + "%"),
                    cb.like(root.get("nickname"), "%" + search + "%")));
          }
          if (role != null) {
            predicates.add(cb.equal(root.get("role"), role));
          }
          return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

    return userRepository
        .findAll(spec, pageable)
        .map(
            user ->
                AdminUserListResponse.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .nickname(user.getNickname())
                    .role(user.getRole())
                    .level(user.getLevel())
                    .points(user.getPoints())
                    .recordCount(user.getRecords().size())
                    .createdAt(user.getCreatedAt())
                    .build());
  }

  @Transactional(readOnly = true)
  public AdminUserDetailResponse getUserDetail(Long userId) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ADMIN_USER_NOT_FOUND));

    long paymentCount = paymentRepository.countByUserId(userId);
    Long totalAmount = paymentRepository.sumAmountByUserId(userId);

    return AdminUserDetailResponse.builder()
        .id(user.getId())
        .email(user.getEmail())
        .nickname(user.getNickname())
        .role(user.getRole())
        .level(user.getLevel())
        .exp(user.getExp())
        .points(user.getPoints())
        .recordCount(user.getRecords().size())
        .paymentCount(paymentCount)
        .totalPaymentAmount(totalAmount != null ? totalAmount : 0L)
        .createdAt(user.getCreatedAt())
        .updatedAt(user.getUpdatedAt())
        .build();
  }

  @Transactional
  public void updateUserRole(Long userId, Role role, String currentAdminEmail) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ADMIN_USER_NOT_FOUND));

    if (user.getEmail().equals(currentAdminEmail)) {
      throw new BusinessException(ErrorCode.ADMIN_CANNOT_CHANGE_OWN_ROLE);
    }

    user.updateRole(role);
  }

  // --- 화장실 관리 ---

  @Transactional(readOnly = true)
  public Page<AdminToiletListResponse> getToilets(String search, Pageable pageable) {
    Page<Toilet> toilets;
    if (search != null && !search.isBlank()) {
      toilets = toiletRepository.findByNameContainingOrAddressContaining(search, search, pageable);
    } else {
      toilets = toiletRepository.findAll(pageable);
    }

    return toilets.map(
        t ->
            AdminToiletListResponse.builder()
                .id(t.getId())
                .name(t.getName())
                .mngNo(t.getMngNo())
                .address(t.getAddress())
                .openHours(t.getOpenHours())
                .is24h(t.is24h())
                .isUnisex(t.isUnisex())
                .latitude(t.getLocation() != null ? t.getLocation().getY() : 0)
                .longitude(t.getLocation() != null ? t.getLocation().getX() : 0)
                .createdAt(t.getCreatedAt())
                .build());
  }

  @Transactional
  public void updateToilet(Long toiletId, AdminToiletUpdateRequest request) {
    Toilet toilet =
        toiletRepository
            .findById(toiletId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ADMIN_TOILET_NOT_FOUND));

    toilet.update(
        request.name(),
        request.address(),
        request.openHours(),
        request.is24h(),
        request.isUnisex());
  }

  // --- 문의 관리 ---

  @Transactional(readOnly = true)
  public Page<AdminInquiryListResponse> getInquiries(InquiryStatus status, Pageable pageable) {
    log.info("Fetching inquiries - Status: {}, Pageable: {}", status, pageable);
    try {
      Page<Inquiry> inquiries;
      if (status != null) {
        inquiries = inquiryRepository.findAllByStatus(status, pageable);
      } else {
        inquiries = inquiryRepository.findAll(pageable);
      }

      log.info("Found {} inquiries in this page. Total elements: {}", inquiries.getContent().size(), inquiries.getTotalElements());

      return inquiries.map(
          i -> {
            try {
              return AdminInquiryListResponse.builder()
                  .id(i.getId())
                  .userName(i.getUser() != null ? i.getUser().getNickname() : "Unknown")
                  .userEmail(i.getUser() != null ? i.getUser().getEmail() : "Unknown")
                  .type(i.getType() != null ? i.getType().getLabel() : "Unknown")
                  .title(i.getTitle())
                  .status(i.getStatus())
                  .createdAt(i.getCreatedAt())
                  .build();
            } catch (Exception e) {
              log.error("Error mapping inquiry entity ID {}: {}", i.getId(), e.getMessage());
              return null;
            }
          });
    } catch (Exception e) {
      log.error("Error in getInquiries: {}", e.getMessage(), e);
      throw e;
    }
  }

  @Transactional(readOnly = true)
  public AdminInquiryDetailResponse getInquiryDetail(Long inquiryId) {
    Inquiry inquiry =
        inquiryRepository
            .findById(inquiryId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ADMIN_INQUIRY_NOT_FOUND));

    return AdminInquiryDetailResponse.builder()
        .id(inquiry.getId())
        .userName(inquiry.getUser().getNickname())
        .userEmail(inquiry.getUser().getEmail())
        .type(inquiry.getType().getLabel())
        .title(inquiry.getTitle())
        .content(inquiry.getContent())
        .answer(inquiry.getAnswer())
        .status(inquiry.getStatus())
        .createdAt(inquiry.getCreatedAt())
        .updatedAt(inquiry.getUpdatedAt())
        .build();
  }

  @Transactional
  public void answerInquiry(Long inquiryId, AdminInquiryAnswerRequest request) {
    Inquiry inquiry =
        inquiryRepository
            .findById(inquiryId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ADMIN_INQUIRY_NOT_FOUND));

    if (inquiry.getStatus() == InquiryStatus.COMPLETED) {
      throw new BusinessException(ErrorCode.ADMIN_INQUIRY_ALREADY_ANSWERED);
    }

    inquiry.answer(request.answer());
  }

  // --- 상점 아이템 관리 ---

  @Transactional(readOnly = true)
  public Page<ItemResponse> getItems(ItemType type, Pageable pageable) {
    Page<Item> items;
    if (type != null) {
      items = itemRepository.findAllByType(type, pageable);
    } else {
      items = itemRepository.findAll(pageable);
    }

    return items.map(
        item ->
            ItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .type(item.getType())
                .price(item.getPrice())
                .imageUrl(item.getImageUrl())
                .build());
  }

  @Transactional
  public ItemResponse createItem(AdminItemCreateRequest request) {
    Item item =
        Item.builder()
            .name(request.name())
            .description(request.description())
            .type(request.type())
            .price(request.price())
            .imageUrl(request.imageUrl())
            .build();

    Item saved = itemRepository.save(item);
    return ItemResponse.builder()
        .id(saved.getId())
        .name(saved.getName())
        .description(saved.getDescription())
        .type(saved.getType())
        .price(saved.getPrice())
        .imageUrl(saved.getImageUrl())
        .build();
  }

  @Transactional
  public ItemResponse updateItem(Long itemId, AdminItemUpdateRequest request) {
    Item item =
        itemRepository
            .findById(itemId)
            .orElseThrow(() -> new BusinessException(ErrorCode.ADMIN_ITEM_NOT_FOUND));

    item.update(
        request.name(), request.description(), request.type(), request.price(), request.imageUrl());

    return ItemResponse.builder()
        .id(item.getId())
        .name(item.getName())
        .description(item.getDescription())
        .type(item.getType())
        .price(item.getPrice())
        .imageUrl(item.getImageUrl())
        .build();
  }

  @Transactional
  public void deleteItem(Long itemId) {
    if (!itemRepository.existsById(itemId)) {
      throw new BusinessException(ErrorCode.ADMIN_ITEM_NOT_FOUND);
    }

    if (inventoryRepository.existsByItemId(itemId)) {
      throw new BusinessException(ErrorCode.ADMIN_ITEM_IN_USE);
    }

    itemRepository.deleteById(itemId);
  }

  // --- 문의 테스트 데이터 생성 ---

  @Transactional
  public void generateInquiryTestData() {
    log.info("Generating 30 inquiry test data...");

    // 테스트용 사용자 가져오기 (없으면 첫 번째 사용자 사용)
    User testUser = userRepository.findByEmail("user1@daypoo.com")
        .or(() -> userRepository.findByEmail("user2@daypoo.com"))
        .orElseGet(() -> userRepository.findAll().stream()
            .filter(u -> u.getRole() == Role.ROLE_USER)
            .findFirst()
            .orElseThrow(() -> new RuntimeException("테스트 문의를 생성할 유저가 없습니다.")));

    log.info("Using test user: {}", testUser.getEmail());

    // 30개의 문의 생성
    InquiryType[] types = InquiryType.values();
    String[] titles = {
        "앱 사용 중 오류가 발생합니다",
        "결제가 완료되지 않아요",
        "화장실 정보가 잘못되었어요",
        "포인트가 적립되지 않았습니다",
        "아이템 구매 후 인벤토리 확인이 안 돼요",
        "AI 분석 결과가 이상합니다",
        "지도에서 화장실이 표시되지 않아요",
        "리뷰 작성 후 반영이 안 됩니다",
        "랭킹 점수가 업데이트되지 않아요",
        "알림이 오지 않습니다"
    };

    for (int i = 0; i < 30; i++) {
      InquiryType type = types[i % types.length];
      String title = titles[i % titles.length] + " #" + (i + 1);
      String content = "문의 내용입니다. 테스트 데이터 " + (i + 1) + "번째 문의입니다.\n"
          + "상세한 설명을 여기에 작성합니다. 문제가 발생한 상황과 재현 방법을 알려주세요.";

      Inquiry inquiry = Inquiry.builder()
          .user(testUser)
          .type(type)
          .title(title)
          .content(content)
          .build();

      inquiryRepository.save(inquiry);

      // 일부 문의는 답변 완료 상태로 설정
      if (i % 3 == 0) {
        inquiry.answer("테스트 답변입니다. 문의해 주셔서 감사합니다.\n"
            + "해당 문제는 확인되었으며, 조치 완료되었습니다.");
      }
    }

    log.info("Successfully generated 30 inquiry test data");
  }
}
