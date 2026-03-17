package com.daypoo.api.service;

import com.daypoo.api.dto.AiAnalysisResponse;
import com.daypoo.api.dto.PooRecordCreateRequest;
import com.daypoo.api.dto.PooRecordResponse;
import com.daypoo.api.entity.PooRecord;
import com.daypoo.api.entity.Toilet;
import com.daypoo.api.entity.User;
import com.daypoo.api.mapper.PooRecordMapper;
import com.daypoo.api.repository.PooRecordRepository;
import com.daypoo.api.repository.ToiletRepository;
import com.daypoo.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("배변 기록 서비스 테스트")
class PooRecordServiceTest {

    @InjectMocks
    private PooRecordService pooRecordService;

    @Mock
    private PooRecordRepository recordRepository;
    @Mock
    private ToiletRepository toiletRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private LocationVerificationService locationVerificationService;
    @Mock
    private RankingService rankingService;
    @Mock
    private AiClient aiClient;
    @Mock
    private PooRecordMapper recordMapper;

    private User testUser;
    private Toilet testToilet;
    private PooRecordCreateRequest request;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .username("testUser")
                .nickname("PoopKing")
                .password("password")
                .build();
        ReflectionTestUtils.setField(testUser, "id", 1L);

        testToilet = Toilet.builder()
                .name("강남역 화장실")
                .address("서울시 강남구 역삼동 800")
                .is24h(true)
                .build();
        ReflectionTestUtils.setField(testToilet, "id", 100L);

        request = new PooRecordCreateRequest(
                100L, 4, "Brown",
                Collections.singletonList("Good"),
                Collections.singletonList("Coffee"),
                37.123, 127.123,
                null
        );
    }

    @Test
    @DisplayName("성공: 배변 기록 생성 및 보상 지급")
    void createRecord_success() {
        // given
        given(userRepository.findByUsername("testUser")).willReturn(Optional.of(testUser));
        given(toiletRepository.findById(100L)).willReturn(Optional.of(testToilet));
        given(locationVerificationService.isWithinAllowedDistance(eq(100L), anyDouble(), anyDouble())).willReturn(true);
        given(locationVerificationService.checkAndSetCooldown(eq(1L), eq(100L))).willReturn(true);

        PooRecord savedRecord = PooRecord.builder()
                .user(testUser)
                .toilet(testToilet)
                .bristolScale(4)
                .color("Brown")
                .build();
        ReflectionTestUtils.setField(savedRecord, "id", 500L);
        
        given(recordRepository.save(any(PooRecord.class))).willReturn(savedRecord);

        // when
        PooRecordResponse response = pooRecordService.createRecord("testUser", request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.toiletName()).isEqualTo("강남역 화장실");
        assertThat(testUser.getExp()).isEqualTo(10L);
        assertThat(testUser.getPoints()).isEqualTo(5L);

        verify(recordRepository).save(any(PooRecord.class));
        verify(userRepository).save(testUser);
        verify(rankingService).updateGlobalRank(testUser);
    }

    @Test
    @DisplayName("성공: AI 이미지 분석 결과 반영")
    void createRecord_withAiAnalysis() {
        // given
        PooRecordCreateRequest aiRequest = new PooRecordCreateRequest(
                100L, 1, "Black",
                Collections.emptyList(), Collections.emptyList(), 37.123, 127.123, "base64image"
        );

        given(userRepository.findByUsername("testUser")).willReturn(Optional.of(testUser));
        given(toiletRepository.findById(100L)).willReturn(Optional.of(testToilet));
        given(locationVerificationService.isWithinAllowedDistance(eq(100L), anyDouble(), anyDouble())).willReturn(true);
        given(locationVerificationService.checkAndSetCooldown(eq(1L), eq(100L))).willReturn(true);

        AiAnalysisResponse aiResponse = new AiAnalysisResponse(5, "Golden", "Perfect", 95);
        given(aiClient.analyzePoopImage(anyString())).willReturn(aiResponse);

        PooRecord savedRecord = PooRecord.builder()
                .user(testUser)
                .toilet(testToilet)
                .bristolScale(5)
                .color("Golden")
                .build();
        ReflectionTestUtils.setField(savedRecord, "id", 501L);
        given(recordRepository.save(any(PooRecord.class))).willReturn(savedRecord);

        // when
        PooRecordResponse response = pooRecordService.createRecord("testUser", aiRequest);

        // then
        assertThat(response.bristolScale()).isEqualTo(5);
        assertThat(response.color()).isEqualTo("Golden");
        verify(aiClient).analyzePoopImage(anyString());
    }

    @Test
    @DisplayName("실패: 화장실 반경 밖에서 인증 시도")
    void createRecord_fail_distance() {
        // given
        given(userRepository.findByUsername("testUser")).willReturn(Optional.of(testUser));
        given(toiletRepository.findById(100L)).willReturn(Optional.of(testToilet));
        given(locationVerificationService.isWithinAllowedDistance(eq(100L), anyDouble(), anyDouble())).willReturn(false);

        // when & then
        assertThatThrownBy(() -> pooRecordService.createRecord("testUser", request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("화장실 반경(50m) 밖");
    }

    @Test
    @DisplayName("실패: 쿨다운 기간 내 중복 인증 시도")
    void createRecord_fail_cooldown() {
        // given
        given(userRepository.findByUsername("testUser")).willReturn(Optional.of(testUser));
        given(toiletRepository.findById(100L)).willReturn(Optional.of(testToilet));
        given(locationVerificationService.isWithinAllowedDistance(eq(100L), anyDouble(), anyDouble())).willReturn(true);
        given(locationVerificationService.checkAndSetCooldown(eq(1L), eq(100L))).willReturn(false);

        // when & then
        assertThatThrownBy(() -> pooRecordService.createRecord("testUser", request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("이미 최근 코인/경험치를 획득한 화장실");
    }
}
