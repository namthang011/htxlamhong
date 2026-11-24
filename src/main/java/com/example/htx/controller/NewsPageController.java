package com.example.htx.controller;

import com.example.htx.repository.PostRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.util.UriComponentsBuilder;

@Controller
public class NewsPageController {
    private final PostRepository posts;

    public NewsPageController(PostRepository posts) { this.posts = posts; }

    @GetMapping("/chi-tiet-tin-tuc")
    public ModelAndView legacyPost(@RequestParam(required = false) Long id) {
        if (id != null) {
            var post = posts.findById(id);
            if (post.isPresent() && post.get().getSlug() != null && !post.get().getSlug().isBlank()) {
                String target = UriComponentsBuilder.fromPath("/tin-tuc/{slug}")
                        .buildAndExpand(post.get().getSlug()).encode().toUriString();
                ModelAndView redirect = new ModelAndView("redirect:" + target);
                redirect.setStatus(HttpStatus.MOVED_PERMANENTLY);
                return redirect;
            }
        }
        return new ModelAndView("forward:/chi-tiet-tin-tuc.html");
    }
}
