package com.limecoding.core;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest
@Import(TestVectorStoreConfig.class)
class CoreApplicationTests {

    @Test
    void contextLoads() {
    }

}
